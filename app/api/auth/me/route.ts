import { connectDB } from "@/lib/db";
import { ok } from "@/lib/api";
import { getCurrentAuth } from "@/lib/auth";
import User from "@/models/User";
import { toUserSafe } from "@/lib/serializers";

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth) {
    return ok({ user: null });
  }

  await connectDB();
  const user = await User.findById(auth.userId);
  if (!user) {
    return ok({ user: null });
  }

  return ok({ user: toUserSafe(user) });
}
