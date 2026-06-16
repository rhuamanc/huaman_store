import { z } from "zod";
import mongoose from "mongoose";
import { fail, ok } from "@/lib/api";
import { CATEGORIES } from "@/types";
import { getCurrentAuth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { toListingSafe } from "@/lib/serializers";

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
        price: z.number().nonnegative().optional(),
        paymentLink: z.string().url("URL de pago de talla inválida"),
      })
    )
    .optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return fail("Anuncio no encontrado", 404);

  let listing;
  try {
    await connectDB();
    listing = await Listing.findById(id).populate("seller");
  } catch {
    try {
      // Retry once for transient connection/query hiccups in serverless runtime.
      await connectDB();
      listing = await Listing.findById(id).populate("seller");
    } catch {
      return fail("No se pudo cargar el anuncio", 500);
    }
  }

  if (!listing) return fail("Anuncio no encontrado", 404);

  const auth = await getCurrentAuth();
  if (listing.status !== "published" && !auth) return fail("Anuncio no disponible", 404);

  const isOwner =
    !!auth &&
    (auth.role === "admin" || listing.seller._id.toString() === auth.userId);

  return ok({ listing: toListingSafe(listing as never), isOwner });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth) return fail("No autenticado", 401);

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return fail("Anuncio no encontrado", 404);

  await connectDB();

  let listing;
  try {
    listing = await Listing.findById(id);
  } catch {
    return fail("No se pudo actualizar el anuncio", 500);
  }

  if (!listing) return fail("Anuncio no encontrado", 404);

  if (listing.seller.toString() !== auth.userId && auth.role !== "admin") {
    return fail("No autorizado", 403);
  }

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Datos inválidos", 400);

  Object.assign(listing, parsed.data);
  await listing.save();
  await listing.populate("seller");

  return ok({ listing: toListingSafe(listing as never) });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth) return fail("No autenticado", 401);

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return fail("Anuncio no encontrado", 404);

  await connectDB();

  let listing;
  try {
    listing = await Listing.findById(id);
  } catch {
    return fail("No se pudo eliminar el anuncio", 500);
  }

  if (!listing) return fail("Anuncio no encontrado", 404);

  if (listing.seller.toString() !== auth.userId && auth.role !== "admin") {
    return fail("No autorizado", 403);
  }

  await listing.deleteOne();
  return ok({ message: "Anuncio eliminado" });
}
