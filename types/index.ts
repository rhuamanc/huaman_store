export const CATEGORIES = ["Ropa", "Electrónica", "Hogar"] as const;
export type Category = (typeof CATEGORIES)[number];

export type UserRole = "user" | "admin";

export type ListingStatus = "draft" | "published" | "sold" | "archived";
export type ModerationStatus = "pending" | "approved" | "rejected";

export interface IUserSafe {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt?: string;
}

export interface IListingGeo {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
}

export interface IListingSize {
  label: string;       // ej: "S", "M", "L", "XL"
  paymentLink: string; // URL de PagoLink para esta talla
}

export interface IHeroSlide {
  _id?: string;
  title: string;
  subtitle: string;
  image: string;
  order: number;
}

export interface IListing {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  images: string[];
  status: ListingStatus;
  moderationStatus: ModerationStatus;
  paymentLink?: string;
  sizes?: IListingSize[];
  geo?: IListingGeo;
  seller: IUserSafe;
  createdAt: string;
  updatedAt: string;
}

export interface IConversation {
  _id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}
