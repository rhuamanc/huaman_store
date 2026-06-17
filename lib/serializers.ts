import { IUser } from "@/models/User";
import { IListing } from "@/models/Listing";

export function toUserSafe(user: IUser) {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt?.toISOString(),
  };
}

function getFallbackSeller(value: unknown) {
  const id =
    typeof value === "object" && value !== null && "_id" in value
      ? String((value as { _id: unknown })._id)
      : typeof value === "string"
      ? value
      : "unknown";

  return {
    _id: id,
    name: "Usuario",
    email: "",
    role: "user" as const,
    avatar: undefined,
    createdAt: undefined,
  };
}

export function toListingSafe(listing: IListing & { seller: IUser }) {
  const seller =
    listing.seller &&
    typeof listing.seller === "object" &&
    "name" in (listing.seller as unknown as Record<string, unknown>)
      ? toUserSafe(listing.seller)
      : getFallbackSeller(listing.seller);

  return {
    _id: listing._id.toString(),
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: listing.category,
    images: listing.images,
    status: listing.status,
    moderationStatus: listing.moderationStatus,
    paymentLink: listing.paymentLink,
    sizes: listing.sizes,
    geo: listing.geo,
    seller,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}
