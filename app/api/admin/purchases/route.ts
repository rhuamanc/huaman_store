import { connectDB } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getCurrentAuth } from "@/lib/auth";
import Purchase from "@/models/Purchase";

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth || auth.role !== "admin") {
    return fail("Solo administradores", 403);
  }

  await connectDB();
  const purchases = await Purchase.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return ok({ purchases });
}
