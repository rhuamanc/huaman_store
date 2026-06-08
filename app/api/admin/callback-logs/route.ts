import { connectDB } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getCurrentAuth } from "@/lib/auth";
import CallbackLog from "@/models/CallbackLog";

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth || auth.role !== "admin") {
    return fail("Solo administradores", 403);
  }

  await connectDB();
  const logs = await CallbackLog.find()
    .sort({ receivedAt: -1 })
    .limit(100)
    .lean();

  return ok({ logs });
}
