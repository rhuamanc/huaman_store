import { connectDB } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getCurrentAuth } from "@/lib/auth";
import User from "@/models/User";
import Listing from "@/models/Listing";
import Conversation from "@/models/Conversation";

export async function GET() {
  await connectDB();
  const auth = await getCurrentAuth();

  if (!auth || auth.role !== "admin") {
    return fail("Solo administradores", 403);
  }

  const [users, listings, conversations, published, pending] = await Promise.all([
    User.countDocuments(),
    Listing.countDocuments(),
    Conversation.countDocuments(),
    Listing.countDocuments({ status: "published" }),
    Listing.countDocuments({ moderationStatus: "pending" }),
  ]);

  return ok({ users, listings, conversations, published, pending });
}
