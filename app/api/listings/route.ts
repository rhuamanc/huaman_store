import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { CATEGORIES } from "@/types";
import { getCurrentAuth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import { toListingSafe } from "@/lib/serializers";

const createSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  price: z.number().nonnegative(),
  category: z.enum(CATEGORIES),
  images: z.array(z.string().min(1)).default([]),
  status: z.enum(["draft", "published", "sold", "archived"]).default("published"),
  geo: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
  paymentLink: z.string().url().optional().or(z.literal("")),
  sizes: z
    .array(
      z.object({
        label: z.string().min(1),
        price: z.number().nonnegative().optional(),
        paymentLink: z.string().url(),
      })
    )
    .optional(),
});

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { status: "published" };

  if (category && CATEGORIES.includes(category as never)) {
    filter.category = category;
  }

  if (query) {
    filter.$text = { $search: query };
  }

  const listings = await Listing.find(filter)
    .populate("seller")
    .sort({ createdAt: -1 })
    .limit(80);

  return ok({ listings: listings.map((l) => toListingSafe(l as never)) });
}

export async function POST(req: Request) {
  const auth = await getCurrentAuth();
  if (!auth) {
    return fail("No autenticado", 401);
  }

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return fail(`Datos inválidos: ${errors}`, 400);
  }

  await connectDB();
  const user = await User.findById(auth.userId);
  if (!user) return fail("Usuario no encontrado", 404);

  const listing = await Listing.create({
    ...parsed.data,
    seller: user._id,
  });

  await listing.populate("seller");
  return ok({ listing: toListingSafe(listing as never) }, 201);
}
