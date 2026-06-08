"use client";

import { useEffect, useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import { api } from "@/lib/client";
import { IHeroSlide, IListing } from "@/types";

interface Stats {
  users: number;
  listings: number;
  conversations: number;
  published: number;
  pending: number;
}

interface IPurchase {
  _id: string;
  externalId: string;
  orderId: string;
  statusOrder: string;
  amount: string;
  currency: string;
  listingTitle: string;
  createdAt: string;
}

interface ICallbackLog {
  _id: string;
  receivedAt: string;
  signature: string;
  signatureValid: boolean;
  outcome: string;
  notes: string;
  headers: Record<string, string>;
  rawBody: string;
  parsedBody: Record<string, unknown> | null;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [listings, setListings] = useState<IListing[]>([]);
  const [slides, setSlides] = useState<IHeroSlide[]>([]);
  const [purchases, setPurchases] = useState<IPurchase[]>([]);
  const [callbackLogs, setCallbackLogs] = useState<ICallbackLog[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    api<Stats>("/api/admin/stats")
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Sin acceso"));

    api<{ listings: IListing[] }>("/api/admin/listings")
      .then((res) => {
        setListings(res.listings);
        const initial: Record<string, string> = {};
        res.listings.forEach((l) => {
          initial[l._id] = l.paymentLink || "";
        });
        setLinks(initial);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se cargó anuncios"));

    api<{ slides: IHeroSlide[] }>("/api/admin/hero-slides")
      .then((res) => setSlides(res.slides))
      .catch((err) => setError(err instanceof Error ? err.message : "No se cargó carrusel"));

    api<{ purchases: IPurchase[] }>("/api/admin/purchases")
      .then((res) => setPurchases(res.purchases))
      .catch(() => {});

    api<{ logs: ICallbackLog[] }>("/api/admin/callback-logs")
      .then((res) => setCallbackLogs(res.logs))
      .catch(() => {});
  }, []);

  const saveLink = async (id: string) => {
    await api(`/api/listings/${id}/payment-link`, {
      method: "PATCH",
      body: JSON.stringify({ paymentLink: links[id] }),
    });
    alert("Link de pago actualizado");
  };

  const moderate = async (id: string, moderationStatus: "pending" | "approved" | "rejected") => {
    const res = await api<{ listing: IListing }>(`/api/admin/listings/${id}/moderation`, {
      method: "PATCH",
      body: JSON.stringify({ moderationStatus }),
    });

    setListings((old) => old.map((l) => (l._id === id ? res.listing : l)));
  };

  const updateSlide = (order: number, field: "title" | "subtitle" | "image", value: string) => {
    setSlides((old) =>
      old.map((slide) => (slide.order === order ? { ...slide, [field]: value } : slide))
    );
  };

  const saveSlides = async () => {
    const res = await api<{ slides: IHeroSlide[] }>("/api/admin/hero-slides", {
      method: "PUT",
      body: JSON.stringify({ slides }),
    });
    setSlides(res.slides);
    alert("Carrusel actualizado");
  };

  return (
    <main className="container section">
      <h1>Panel Admin</h1>
      {error && <p className="error">{error}</p>}
      {stats && (
        <div className="statsGrid">
          <div className="stat"><span>Usuarios</span><strong>{stats.users}</strong></div>
          <div className="stat"><span>Anuncios</span><strong>{stats.listings}</strong></div>
          <div className="stat"><span>Publicados</span><strong>{stats.published}</strong></div>
          <div className="stat"><span>Pendientes</span><strong>{stats.pending}</strong></div>
          <div className="stat"><span>Chats</span><strong>{stats.conversations}</strong></div>
        </div>
      )}

      <section className="card adminCarouselEditor">
        <div className="row between center wrap gap">
          <div>
            <h2>Carrusel principal</h2>
            <p className="muted small">Sube las imágenes del banner principal y actualiza los textos.</p>
          </div>
          <button className="cta" type="button" onClick={saveSlides}>
            Guardar carrusel
          </button>
        </div>
        <div className="adminSlidesGrid">
          {slides.map((slide) => (
            <div className="card adminSlideCard" key={slide.order}>
              <span className="tag">Slide {slide.order}</span>
              <label className="fieldLabel" htmlFor={`slide-title-${slide.order}`}>Título</label>
              <input
                id={`slide-title-${slide.order}`}
                value={slide.title}
                onChange={(e) => updateSlide(slide.order, "title", e.target.value)}
                placeholder="Título"
              />
              <label className="fieldLabel" htmlFor={`slide-subtitle-${slide.order}`}>Subtítulo</label>
              <textarea
                id={`slide-subtitle-${slide.order}`}
                value={slide.subtitle}
                onChange={(e) => updateSlide(slide.order, "subtitle", e.target.value)}
                placeholder="Subtítulo"
              />
              <label className="fieldLabel">Imagen del slide</label>
              <ImageUploader
                images={slide.image ? [slide.image] : []}
                onChange={(images) => updateSlide(slide.order, "image", images[0] || "")}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Anuncio</th>
              <th>Categoría</th>
              <th>Vendedor</th>
              <th>Moderación</th>
              <th>Pago Link</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing._id}>
                <td>{listing.title}</td>
                <td>{listing.category}</td>
                <td>{listing.seller.name}</td>
                <td>
                  <div className="row gap wrap">
                    <span className={`badge ${listing.moderationStatus}`}>{listing.moderationStatus}</span>
                    <button className="ghostBtn smallBtn" onClick={() => moderate(listing._id, "approved")}>
                      Aprobar
                    </button>
                    <button className="ghostBtn smallBtn" onClick={() => moderate(listing._id, "rejected")}>
                      Rechazar
                    </button>
                    <button className="ghostBtn smallBtn" onClick={() => moderate(listing._id, "pending")}>
                      Pendiente
                    </button>
                  </div>
                </td>
                <td>
                  <label className="fieldLabel srOnly" htmlFor={`payment-link-${listing._id}`}>Pago Link</label>
                  <input
                    id={`payment-link-${listing._id}`}
                    value={links[listing._id] || ""}
                    onChange={(e) => setLinks((old) => ({ ...old, [listing._id]: e.target.value }))}
                    placeholder="https://..."
                  />
                </td>
                <td>
                  <button className="cta smallBtn" onClick={() => saveLink(listing._id)}>
                    Guardar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card" style={{ marginTop: "2rem" }}>
        <div className="row between center wrap gap" style={{ marginBottom: "1rem" }}>
          <div>
            <h2>💳 Notificaciones de compra</h2>
            <p className="muted small">Pagos recibidos vía callback de Niubiz.</p>
          </div>
          <span className="chip">{purchases.length} registros</span>
        </div>
        {purchases.length === 0 ? (
          <p className="muted">No hay compras registradas todavía.</p>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Anuncio</th>
                  <th>Orden Niubiz</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p._id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(p.createdAt).toLocaleString("es-PE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td>{p.listingTitle}</td>
                    <td>
                      <code style={{ fontSize: "0.8rem" }}>{p.orderId}</code>
                    </td>
                    <td>
                      <strong>
                        {p.currency} {p.amount}
                      </strong>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: p.statusOrder === "COMPLETED" ? "#d1fae5" : "#fee2e2",
                          color: p.statusOrder === "COMPLETED" ? "#065f46" : "#991b1b",
                        }}
                      >
                        {p.statusOrder}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: "2rem" }}>
        <div className="row between center wrap gap" style={{ marginBottom: "1rem" }}>
          <div>
            <h2>🔍 Auditoría de callbacks Niubiz</h2>
            <p className="muted small">Registro de cada request recibido en <code>/api/niubiz/callback</code>.</p>
          </div>
          <span className="chip">{callbackLogs.length} registros</span>
        </div>
        {callbackLogs.length === 0 ? (
          <p className="muted">No hay callbacks registrados todavía.</p>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Resultado</th>
                  <th>Firma válida</th>
                  <th>Notas</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {callbackLogs.map((log) => (
                  <>
                    <tr key={log._id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(log.receivedAt).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "medium" })}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: log.outcome === "processed" ? "#d1fae5" : log.outcome === "invalid_signature" || log.outcome === "missing_signature" ? "#fee2e2" : "#fef9c3",
                            color: log.outcome === "processed" ? "#065f46" : log.outcome === "invalid_signature" || log.outcome === "missing_signature" ? "#991b1b" : "#713f12",
                          }}
                        >
                          {log.outcome}
                        </span>
                      </td>
                      <td>{log.signatureValid ? "✅" : "❌"}</td>
                      <td className="muted small">{log.notes}</td>
                      <td>
                        <button
                          className="ghostBtn smallBtn"
                          onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                        >
                          {expandedLog === log._id ? "Ocultar" : "Ver"}
                        </button>
                      </td>
                    </tr>
                    {expandedLog === log._id && (
                      <tr key={`${log._id}-detail`}>
                        <td colSpan={5} style={{ padding: "0.75rem", background: "#f8f8f8" }}>
                          <p className="small" style={{ marginBottom: "0.4rem" }}><strong>Headers:</strong></p>
                          <pre style={{ fontSize: "0.75rem", overflowX: "auto", background: "#1e1e1e", color: "#d4d4d4", padding: "0.75rem", borderRadius: "0.5rem" }}>
                            {JSON.stringify(log.headers, null, 2)}
                          </pre>
                          <p className="small" style={{ margin: "0.5rem 0 0.4rem" }}><strong>Body raw:</strong></p>
                          <pre style={{ fontSize: "0.75rem", overflowX: "auto", background: "#1e1e1e", color: "#d4d4d4", padding: "0.75rem", borderRadius: "0.5rem" }}>
                            {log.parsedBody ? JSON.stringify(log.parsedBody, null, 2) : log.rawBody}
                          </pre>
                          {log.signature && (
                            <>
                              <p className="small" style={{ margin: "0.5rem 0 0.4rem" }}><strong>NBZ-Signature:</strong></p>
                              <code style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>{log.signature}</code>
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
