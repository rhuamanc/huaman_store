"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError, api } from "@/lib/client";
import { IListing } from "@/types";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import Carousel from "@/components/Carousel";
import ListingForm from "@/components/ListingForm";

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<IListing | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [editing, setEditing] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const listingId = params.id;
    if (!listingId) return;

    let cancelled = false;

    setError("");
    setListing(null);

    api<{ listing: IListing; isOwner: boolean }>(`/api/listings/${listingId}`)
      .then((res) => {
        if (cancelled) return;

        setListing(res.listing);
        setIsOwner(res.isOwner);
        setSelectedSize(res.listing.sizes?.[0]?.label ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar");
      });

    api<{ user: { _id: string } | null }>("/api/auth/me")
      .then((res) => {
        if (cancelled) return;
        setLoggedIn(!!res.user);
      })
      .catch(() => {
        if (cancelled) return;
        setLoggedIn(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const startChat = async () => {
    try {
      const res = await api<{ conversationId: string }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ listingId: params.id }),
      });
      window.location.href = `/chat?c=${res.conversationId}`;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = `/login?next=/listing/${params.id}`;
        return;
      }
      setError(err instanceof Error ? err.message : "No se pudo iniciar el chat");
    }
  };

  if (error) {
    return (
      <main className="container section">
        <p className="error">{error}</p>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="container section">
        <p>Cargando...</p>
      </main>
    );
  }

  if (editing) {
    return (
      <main className="container section">
        <ListingForm
          initial={listing}
          onUpdated={(updated) => {
            setListing(updated);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </main>
    );
  }

  return (
    <main className="container section detailGrid">
      <section className="card">
        <Carousel images={listing.images} alt={listing.title} height={340} zoomable />
        <h1>{listing.title}</h1>
        <p className="price">S/ {listing.price.toFixed(2)}</p>
        <p>{listing.description}</p>
        <p className="muted">Categoría: {listing.category}</p>
        {listing.geo && listing.geo.lat != null && listing.geo.lng != null && (
          <p className="muted">
            Ubicación: {listing.geo.city || "No definida"} ({listing.geo.lat.toFixed(5)}, {listing.geo.lng.toFixed(5)})
          </p>
        )}
      </section>
      <aside className="card sticky">

        {listing.sizes && listing.sizes.length > 0 && (
          <div style={{ margin: "0 0 0.75rem" }}>
            <p className="fieldLabel" style={{ marginBottom: "0.5rem" }}>Selecciona tu talla:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {listing.sizes.map((s) => {
                const active = selectedSize === s.label;
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setSelectedSize(s.label)}
                    style={{
                      padding: "0.45rem 1rem",
                      borderRadius: "0.6rem",
                      border: `2px solid ${active ? "var(--brand)" : "var(--line)"}`,
                      background: active ? "var(--brand)" : "#fff",
                      color: active ? "#fff" : "var(--ink)",
                      fontWeight: active ? 700 : 500,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: active ? "0 2px 8px rgba(228,87,46,0.25)" : "none",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(() => {
          const activeSize = listing.sizes?.find((s) => s.label === selectedSize);
          const activeLink = listing.sizes && listing.sizes.length > 0
            ? activeSize?.paymentLink
            : listing.paymentLink;
          const activePrice = activeSize?.price ?? (listing.sizes && listing.sizes.length > 0 ? undefined : listing.price);
          return activeLink ? (
            <a
              href={activeLink}
              target="_blank"
              rel="noreferrer"
              className="cta"
              style={{ display: "block", textAlign: "center", marginBottom: "0.5rem" }}
            >
              💳 Pagar{activePrice != null ? ` S/ ${activePrice.toFixed(2)}` : " ahora"}
              {selectedSize ? ` — Talla ${selectedSize}` : ""}
            </a>
          ) : null;
        })()}

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, me interesa el anuncio: ${listing.title} 👉 ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
          target="_blank"
          rel="noreferrer"
          className="whatsappBtn"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.85L.057 23.572a.5.5 0 0 0 .614.614l5.722-1.471A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 0 1-5.073-1.387l-.362-.214-3.754.965.984-3.648-.235-.374A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          Consultar por WhatsApp
        </a>

        {loggedIn === false && (
          <p className="small muted" style={{ marginTop: "0.5rem" }}>Inicia sesión para gestionar tus anuncios.</p>
        )}
        {isOwner && (
          <>
            <button className="ghostBtn" style={{ marginTop: "0.5rem", width: "100%" }} onClick={() => setEditing(true)}>
              ✏️ Editar anuncio
            </button>
            <button
              className="ghostBtn"
              style={{ marginTop: "0.4rem", width: "100%", color: "#c0392b", borderColor: "#c0392b" }}
              onClick={async () => {
                if (!confirm("¿Eliminar este anuncio? Esta acción no se puede deshacer.")) return;
                try {
                  await api(`/api/listings/${params.id}`, { method: "DELETE" });
                  window.location.href = "/dashboard";
                } catch (err) {
                  setError(err instanceof Error ? err.message : "No se pudo eliminar");
                }
              }}
            >
              🗑️ Eliminar anuncio
            </button>
          </>
        )}

        <div className="howToBuy" style={{ marginTop: "1rem" }}>
          <h3>¿Cómo comprar?</h3>
          <ol className="howToBuySteps">
            <li>
              <div>
                <strong>Elige tu talla</strong> (si aplica) y haz clic en <em>💳 Pagar ahora</em>.
              </div>
            </li>
            <li>
              <div>
                <strong>Completa el pago</strong> y toma una captura de la confirmación.
              </div>
            </li>
            <li>
              <div>
                <strong>Envía la constancia</strong> por WhatsApp con tu nombre completo.
              </div>
            </li>
            <li>
              <div>
                <strong>Coordina el envío</strong> por WhatsApp: dirección, distrito y detalles.
              </div>
            </li>
          </ol>
        </div>
      </aside>
    </main>
  );
}
