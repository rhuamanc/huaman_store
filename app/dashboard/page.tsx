"use client";

import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import ListingForm from "@/components/ListingForm";
import { ApiError, api } from "@/lib/client";
import { IListing } from "@/types";

export default function DashboardPage() {
  const [listings, setListings] = useState<IListing[]>([]);
  const [error, setError] = useState("");

  const load = () => {
    api<{ listings: IListing[] }>("/api/listings?mine=1")
      .then((res) => setListings(res.listings))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = "/login?next=/dashboard";
          return;
        }
        setError(err instanceof Error ? err.message : "No se pudo cargar");
      });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="container section grid2">
      <ListingForm onCreated={(listing) => setListings((old) => [listing, ...old])} />
      <section>
        <h1>Mis anuncios</h1>
        {error && <p className="error">{error}</p>}
        <div className="cards">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  );
}
