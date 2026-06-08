import { createHmac, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { connectDB } from "@/lib/db";
import Purchase from "@/models/Purchase";

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

async function readListings(): Promise<Listing[]> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
  } catch { return []; }
}

async function writeListings(listings: Listing[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(listings, null, 2));
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("nbz-signature") ?? req.headers.get("NBZ-Signature") ?? "";

  // Log completo para el primer callback real — quitar en producción
  console.log("[niubiz/callback] Headers:", Object.fromEntries(req.headers.entries()));
  console.log("[niubiz/callback] Body:", rawBody);
  console.log("[niubiz/callback] NBZ-Signature:", signature);

  if (!signature) {
    console.warn("[niubiz/callback] Sin firma — rechazado");
    return new Response("Sin firma", { status: 401 });
  }

  if (!verifySignature(rawBody, signature)) {
    console.warn("[niubiz/callback] Firma inválida — rechazado");
    return new Response("Firma inválida", { status: 401 });
  }

  let payload: NiubizPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Payload inválido", { status: 400 });
  }

  console.log("[niubiz/callback] Pago recibido:", payload);

  // Buscar título del listing para guardarlo en la notificación
  const listings = await readListings();
  const listingIndex = listings.findIndex((l) => l.id === payload.externalId);
  const listingTitle = listingIndex !== -1 ? listings[listingIndex].title : payload.externalId;

  // Guardar notificación en MongoDB (evitar duplicados por orderId)
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

  // Marcar listing como vendido si el pago fue completado
  if (payload.statusOrder === "COMPLETED" && listingIndex !== -1) {
    listings[listingIndex].status = "sold";
    listings[listingIndex].updatedAt = new Date().toISOString();
    await writeListings(listings);
    console.log(`[niubiz/callback] Listing "${listingTitle}" marcado como VENDIDO`);
  }

  // Niubiz necesita 200 para no reintentar
  return new Response("OK", { status: 200 });
}
