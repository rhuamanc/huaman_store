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

export function toListingSafe(listing: IListing & { seller: IUser }) {
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
    geo: listing.geo,
    seller: toUserSafe(listing.seller),
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}
