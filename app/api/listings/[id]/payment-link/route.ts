import { z } from "zod";
import { connectDB } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getCurrentAuth } from "@/lib/auth";
import Listing from "@/models/Listing";
import { toListingSafe } from "@/lib/serializers";

const schema = z.object({
  paymentLink: z.string().url(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const auth = await getCurrentAuth();
  if (!auth || auth.role !== "admin") {
    return fail("Solo administradores", 403);
  }

  const { id } = await params;
  const listing = await Listing.findById(id);
  if (!listing) {
    return fail("Anuncio no encontrado", 404);
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail("Link inválido", 400);
  }

  listing.paymentLink = parsed.data.paymentLink;
  await listing.save();
  const hydrated = await listing.populate("seller");

  return ok({ listing: toListingSafe(hydrated as never) });
}
