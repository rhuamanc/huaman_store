import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { fail, ok } from "@/lib/api";
import { CATEGORIES } from "@/types";
import { getCurrentAuth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { toUserSafe } from "@/lib/serializers";

const DATA_FILE = path.join(process.cwd(), "data", "listings.json");

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  status: string;
  paymentLink?: string;
  sizes?: { label: string; paymentLink: string }[];
  geo?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
  };
  seller: string;
  createdAt: string;
  updatedAt: string;
}

const updateSchema = z.object({
  title: z.string().min(4).optional(),
  description: z.string().min(10).optional(),
  price: z.number().nonnegative().optional(),
  category: z.enum(CATEGORIES).optional(),
  images: z.array(z.string().min(1)).optional(),
  status: z.enum(["draft", "published", "sold", "archived"]).optional(),
  geo: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
  paymentLink: z.string().url("URL de pago inválida").optional().or(z.literal("")),
  sizes: z
    .array(
      z.object({
        label: z.string().min(1),
        paymentLink: z.string().url("URL de pago de talla inválida"),
      })
    )
    .optional(),
});

async function readListings(): Promise<Listing[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeListings(listings: Listing[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(listings, null, 2));
}

async function buildSellerObject(sellerId: string) {
  if (sellerId && sellerId !== "anonymous") {
    try {
      await connectDB();
      const user = await User.findById(sellerId);
      if (user) return toUserSafe(user);
    } catch {
      // seller id no es un ObjectId válido, continuar
    }
  }
  return { _id: sellerId || "anonymous", name: "Vendedor", email: "", role: "user" as const };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listings = await readListings();
  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return fail("Anuncio no encontrado", 404);
  }

  const auth = await getCurrentAuth();

  if (listing.status !== "published" && !auth) {
    return fail("Anuncio no disponible", 404);
  }

  const seller = await buildSellerObject(listing.seller);
  const isOwner =
    !!auth &&
    (
      auth.userId === listing.seller ||
      auth.role === "admin" ||
      listing.seller === "anonymous" // listings creados antes de tener autenticación
    );
  return ok({ listing: { ...listing, _id: listing.id, seller }, isOwner });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth) {
    return fail("No autenticado", 401);
  }

  const { id } = await params;
  const listings = await readListings();
  const index = listings.findIndex((l) => l.id === id);

  if (index === -1) {
    return fail("Anuncio no encontrado", 404);
  }

  const listing = listings[index];
  if (
    listing.seller !== auth.userId &&
    auth.role !== "admin" &&
    listing.seller !== "anonymous"
  ) {
    return fail("No autorizado", 403);
  }

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail("Datos inválidos", 400);
  }

  Object.assign(listing, parsed.data);
  listing.updatedAt = new Date().toISOString();

  await writeListings(listings);
  const seller = await buildSellerObject(listing.seller);
  return ok({ listing: { ...listing, _id: listing.id, seller } });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth) {
    return fail("No autenticado", 401);
  }

  const { id } = await params;
  const listings = await readListings();
  const index = listings.findIndex((l) => l.id === id);

  if (index === -1) {
    return fail("Anuncio no encontrado", 404);
  }

  const listing = listings[index];
  if (
    listing.seller !== auth.userId &&
    auth.role !== "admin" &&
    listing.seller !== "anonymous"
  ) {
    return fail("No autorizado", 403);
  }

  listings.splice(index, 1);
  await writeListings(listings);

  return ok({ message: "Anuncio eliminado" });
}
