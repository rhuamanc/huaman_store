import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getCurrentAuth } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

const schema = z.object({
  text: z.string().min(1).max(2000),
});

async function getConversationForUser(conversationId: string, userId: string) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return null;
  }
  const isMember =
    conversation.buyer.toString() === userId || conversation.seller.toString() === userId;
  if (!isMember) {
    return null;
  }
  return conversation;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const auth = await getCurrentAuth();
  if (!auth) {
    return fail("No autenticado", 401);
  }

  const { id } = await params;
  const conversation = await getConversationForUser(id, auth.userId);
  if (!conversation) {
    return fail("Conversación no encontrada", 404);
  }

  const messages = await Message.find({ conversation: new mongoose.Types.ObjectId(id) })
    .populate("sender", "name")
    .sort({ createdAt: 1 });

  return ok({
    messages: messages.map((m) => ({
      _id: m._id.toString(),
      text: m.text,
      sender: m.sender,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const auth = await getCurrentAuth();
  if (!auth) {
    return fail("No autenticado", 401);
  }

  const { id } = await params;
  const conversation = await getConversationForUser(id, auth.userId);
  if (!conversation) {
    return fail("Conversación no encontrada", 404);
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail("Mensaje inválido", 400);
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: auth.userId,
    text: parsed.data.text,
  });

  conversation.updatedAt = new Date();
  await conversation.save();

  const hydrated = await message.populate("sender", "name");
  return ok(
    {
      message: {
        _id: hydrated._id.toString(),
        text: hydrated.text,
        sender: hydrated.sender,
        createdAt: hydrated.createdAt.toISOString(),
      },
    },
    201
  );
}
