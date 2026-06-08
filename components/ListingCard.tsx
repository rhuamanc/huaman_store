import Link from "next/link";
import { IListing } from "@/types";
import Carousel from "@/components/Carousel";

export default function ListingCard({ listing }: { listing: IListing }) {
  const listingId = (listing as any).id || (listing as any)._id;
  
  return (
    <Link href={`/listing/${listingId}`} className="card listingCard listingCardLink">
      <Carousel images={listing.images} alt={listing.title} height={170} />
      <div className="cardBody">
        <div className="tag">{listing.category}</div>
        <h3>{listing.title}</h3>
        <p className="price">S/ {listing.price.toFixed(2)}</p>
        <p className="muted clamp2">{listing.description}</p>
        <p className="muted small">
          {listing.geo?.city || "Sin ciudad"} {listing.geo ? "| con ubicación" : ""}
        </p>
        {(listing as any).moderationStatus && (
          <p className="small muted">Moderación: {(listing as any).moderationStatus}</p>
        )}
      </div>
    </Link>
  );
}
