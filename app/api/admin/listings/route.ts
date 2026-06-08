import { connectDB } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getCurrentAuth } from "@/lib/auth";
import Listing from "@/models/Listing";
import { toListingSafe } from "@/lib/serializers";

export async function GET() {
  await connectDB();
  const auth = await getCurrentAuth();

  if (!auth || auth.role !== "admin") {
    return fail("Solo administradores", 403);
  }

  const listings = await Listing.find({}).populate("seller").sort({ createdAt: -1 }).limit(200);

  return ok({
    listings: listings.map((listing) => toListingSafe(listing as never)),
  });
}
