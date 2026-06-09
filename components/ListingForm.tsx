"use client";

import { useState } from "react";
import { CATEGORIES, IListing, IListingSize } from "@/types";
import { api } from "@/lib/client";
import ImageUploader from "@/components/ImageUploader";

interface Props {
  onCreated?: (listing: IListing) => void;
  onUpdated?: (listing: IListing) => void;
  initial?: IListing;
  onCancel?: () => void;
}

export default function ListingForm({ onCreated, onUpdated, initial, onCancel }: Props) {
  const editing = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(initial?.category ?? "Ropa");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [city, setCity] = useState(initial?.geo?.city ?? "");
  const [address, setAddress] = useState(initial?.geo?.address ?? "");
  const [lat, setLat] = useState<number | null>(initial?.geo?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.geo?.lng ?? null);
  const [paymentLink, setPaymentLink] = useState(initial?.paymentLink ?? "");
  const [sizes, setSizes] = useState<IListingSize[]>(initial?.sizes ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const captureGeo = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {
        setError("No se pudo obtener tu geolocalización");
      }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        title,
        description,
        price: Number(price),
        category,
        images,
        paymentLink: paymentLink.trim() || undefined,
        sizes: sizes.length > 0 ? sizes : undefined,
      };

      if (lat !== null && lng !== null) {
        payload.geo = { lat, lng, address, city };
      }

      if (editing && initial) {
        const res = await api<{ listing: IListing }>(`/api/listings/${initial._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        onUpdated?.(res.listing);
      } else {
        const res = await api<{ listing: IListing }>("/api/listings", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        onCreated?.(res.listing);
        setTitle("");
        setDescription("");
        setPrice(0);
        setImages([]);
        setAddress("");
        setCity("");
        setLat(null);
        setLng(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : editing ? "Error al actualizar anuncio" : "Error al crear anuncio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h2>{editing ? "Editar anuncio" : "Publicar anuncio"}</h2>
      <label className="fieldLabel" htmlFor="listing-title">Título</label>
      <input id="listing-title" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <label className="fieldLabel" htmlFor="listing-description">Descripción</label>
      <textarea
        id="listing-description"
        placeholder="Describe el producto"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <label className="fieldLabel" htmlFor="listing-price">Precio</label>
      <input
        id="listing-price"
        placeholder="Precio"
        type="number"
        min={0}
        step="0.1"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        required
      />
      <label className="fieldLabel" htmlFor="listing-category">Categoría</label>
      <select id="listing-category" value={category} onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}>
        {CATEGORIES.map((cat) => (
          <option key={cat}>{cat}</option>
        ))}
      </select>
      <label className="fieldLabel" htmlFor="listing-images">Fotos del producto</label>
      <ImageUploader images={images} onChange={setImages} />
      <div className="row gap">
        <div className="fieldCol">
          <label className="fieldLabel" htmlFor="listing-city">Ciudad</label>
          <input id="listing-city" placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="fieldCol">
          <label className="fieldLabel" htmlFor="listing-address">Dirección referencial</label>
          <input id="listing-address" placeholder="Dirección referencial" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>
      <button className="ghostBtn" type="button" onClick={captureGeo}>
        📍 Capturar geolocalización
      </button>
      {lat !== null && lng !== null && (
        <p className="small muted">
          Ubicación: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}
      <label className="fieldLabel" htmlFor="listing-paymentLink">Enlace de pago general (opcional)</label>
      <input
        id="listing-paymentLink"
        placeholder="https://pagolink.niubiz.com.pe/pagoseguro/..."
        value={paymentLink}
        onChange={(e) => setPaymentLink(e.target.value)}
      />

      <div className="fieldLabel" style={{ marginTop: "1rem" }}>Tallas con precio y enlace de pago</div>
      {sizes.map((size, i) => (
        <div key={i} className="row gap" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <input
            placeholder="Talla (ej: S, M, L)"
            value={size.label}
            style={{ width: "6rem", flexShrink: 0 }}
            onChange={(e) => {
              const next = [...sizes];
              next[i] = { ...next[i], label: e.target.value };
              setSizes(next);
            }}
          />
          <input
            type="number"
            placeholder="Precio S/"
            value={size.price ?? ""}
            style={{ width: "7rem", flexShrink: 0 }}
            min={0}
            step={0.01}
            onChange={(e) => {
              const next = [...sizes];
              next[i] = { ...next[i], price: e.target.value === "" ? undefined : parseFloat(e.target.value) };
              setSizes(next);
            }}
          />
          <input
            placeholder="https://pagolink.niubiz.com.pe/pagoseguro/..."
            value={size.paymentLink}
            style={{ flex: 1, minWidth: "10rem" }}
            onChange={(e) => {
              const next = [...sizes];
              next[i] = { ...next[i], paymentLink: e.target.value };
              setSizes(next);
            }}
          />
          <button
            type="button"
            className="ghostBtn"
            style={{ flexShrink: 0 }}
            onClick={() => setSizes(sizes.filter((_, idx) => idx !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="ghostBtn"
        onClick={() => setSizes([...sizes, { label: "", paymentLink: "" }])}
      >
        + Agregar talla
      </button>
      {error && <p className="error">{error}</p>}
      <div className="row gap">
        <button className="cta" disabled={loading} type="submit">
          {loading ? (editing ? "Guardando..." : "Publicando...") : (editing ? "Guardar cambios" : "Publicar")}
        </button>
        {onCancel && (
          <button className="ghostBtn" type="button" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
