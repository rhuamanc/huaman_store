import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getCurrentAuth } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import Listing from "@/models/Listing";

const schema = z.object({
  listingId: z.string().min(20),
});

export async function GET() {
  await connectDB();
  const auth = await getCurrentAuth();
  if (!auth) {
    return fail("No autenticado", 401);
  }

  const conversations = await Conversation.find({
    $or: [{ buyer: auth.userId }, { seller: auth.userId }],
  })
    .populate("listing")
    .populate("buyer", "name")
    .populate("seller", "name")
    .sort({ updatedAt: -1 });

  return ok({
    conversations: conversations.map((c) => ({
      _id: c._id.toString(),
      listing: c.listing,
      buyer: c.buyer,
      seller: c.seller,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  await connectDB();
  const auth = await getCurrentAuth();
  if (!auth) {
    return fail("No autenticado", 401);
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail("Datos inválidos", 400);
  }

  const listing = await Listing.findById(parsed.data.listingId);
  if (!listing) {
    return fail("Anuncio no encontrado", 404);
  }

  if (listing.seller.toString() === auth.userId) {
    return fail("No puedes iniciar chat contigo mismo", 400);
  }

  const baseFilter = {
    listing: new mongoose.Types.ObjectId(parsed.data.listingId),
    buyer: new mongoose.Types.ObjectId(auth.userId),
    seller: listing.seller,
  };

  let conversation = await Conversation.findOne(baseFilter);
  if (!conversation) {
    conversation = await Conversation.create(baseFilter);
  }

  return ok({ conversationId: conversation._id.toString() }, 201);
}
