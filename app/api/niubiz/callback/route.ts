import { createHmac, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { connectDB } from "@/lib/db";
import Purchase from "@/models/Purchase";
import CallbackLog, { ICallbackLog } from "@/models/CallbackLog";

const DATA_FILE = path.join(process.cwd(), "data", "listings.json");

interface NiubizPayload {
  externalId: string;
  orderId: string;
  statusOrder: string;
  amount: string;
  currency: string;
}

interface Listing {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  [key: string]: unknown;
}

function getSecret(): string {
  const secret = process.env.NIUBIZ_CALLBACK_SECRET;
  if (!secret) throw new Error("Falta NIUBIZ_CALLBACK_SECRET en el entorno.");
  return secret;
}

function verifySignature(rawBody: string, receivedSig: string): boolean {
  const secret = getSecret();
  const sigBase64 = createHmac("sha256", secret).update(rawBody).digest("base64");
  const sigHex    = createHmac("sha256", secret).update(rawBody).digest("hex");
  const buf = Buffer.from(receivedSig);
  try { if (timingSafeEqual(Buffer.from(sigBase64), buf)) return true; } catch { /* distinto largo */ }
  try { if (timingSafeEqual(Buffer.from(sigHex),    buf)) return true; } catch { /* distinto largo */ }
  return false;
}

async function saveLog(data: Omit<Partial<ICallbackLog>, "_id" | "__v">) {
  try {
    await connectDB();
    await CallbackLog.create(data);
  } catch (e) {
    console.error("[niubiz/callback] Error guardando audit log:", e);
  }
}

async function readListings(): Promise<Listing[]> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
  } catch { return []; }
}

async function writeListings(listings: Listing[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(listings, null, 2));
}

export async function POST(req: Request) {
  const rawBody  = await req.text();
  const headers  = Object.fromEntries(req.headers.entries());
  const signature = headers["nbz-signature"] ?? headers["NBZ-Signature"] ?? "";

  console.log("[niubiz/callback] Headers:", headers);
  console.log("[niubiz/callback] Body:", rawBody);
  console.log("[niubiz/callback] NBZ-Signature:", signature);

  const baseLog = { rawBody, headers, signature, method: "POST" };

  // Sin firma
  if (!signature) {
    await saveLog({ ...baseLog, signatureValid: false, outcome: "missing_signature", notes: "Header NBZ-Signature ausente" });
    console.warn("[niubiz/callback] Sin firma — rechazado");
    return new Response("Sin firma", { status: 401 });
  }

  const signatureValid = verifySignature(rawBody, signature);

  // Firma inválida
  if (!signatureValid) {
    await saveLog({ ...baseLog, signatureValid: false, outcome: "invalid_signature", notes: "La firma no coincide con ningún algoritmo (base64/hex)" });
    console.warn("[niubiz/callback] Firma inválida — rechazado");
    return new Response("Firma inválida", { status: 401 });
  }

  // Parseo
  let payload: NiubizPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    await saveLog({ ...baseLog, signatureValid: true, outcome: "parse_error", notes: "JSON inválido en el body" });
    return new Response("Payload inválido", { status: 400 });
  }

  console.log("[niubiz/callback] Pago recibido:", payload);

  // Buscar listing
  const listings = await readListings();
  const listingIndex = listings.findIndex((l) => l.id === payload.externalId);
  const listingTitle = listingIndex !== -1 ? listings[listingIndex].title : payload.externalId;

  // Guardar compra en MongoDB
  await connectDB();
  await Purchase.findOneAndUpdate(
    { orderId: payload.orderId },
    {
      externalId:   payload.externalId,
      orderId:      payload.orderId,
      statusOrder:  payload.statusOrder,
      amount:       payload.amount,
      currency:     payload.currency ?? "PEN",
      listingTitle,
      rawPayload:   rawBody,
    },
    { upsert: true, new: true }
  );

  // Marcar como vendido si corresponde
  let outcome: ICallbackLog["outcome"] = "ignored";
  let notes = `statusOrder=${payload.statusOrder}`;

  if (payload.statusOrder === "COMPLETED") {
    if (listingIndex !== -1) {
      listings[listingIndex].status = "sold";
      listings[listingIndex].updatedAt = new Date().toISOString();
      await writeListings(listings);
      outcome = "processed";
      notes += ` | Listing "${listingTitle}" marcado como VENDIDO`;
      console.log(`[niubiz/callback] Listing "${listingTitle}" marcado como VENDIDO`);
    } else {
      outcome = "listing_not_found";
      notes += ` | externalId ${payload.externalId} no encontrado en listings.json`;
      console.warn(`[niubiz/callback] Listing ${payload.externalId} no encontrado`);
    }
  }

  // Guardar audit log
  await saveLog({
    ...baseLog,
    parsedBody: payload as unknown as Record<string, unknown>,
    signatureValid: true,
    outcome,
    notes,
  });

  return new Response("OK", { status: 200 });
}
