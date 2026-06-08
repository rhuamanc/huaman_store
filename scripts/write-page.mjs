import { writeFileSync } from "fs";

const content = `"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { api } from "@/lib/client";
import { CATEGORIES, IListing } from "@/types";

const CAT_META = [
  { label: "Ropa",        icon: "\u{1F455}", bg: "#fff4e6", color: "#a84800" },
  { label: "Electr\u00F3nica", icon: "\u{1F4F1}", bg: "#e8f4ff", color: "#00508a" },
  { label: "Hogar",       icon: "\u{1FA91}", bg: "#e8fff2", color: "#00663e" },
] as const;

const SLIDES = [
  {
    title: "Vende lo que ya no usas",
    sub: "Publica tu anuncio gratis en minutos y llega a miles de compradores.",
    bg: "linear-gradient(120deg,#e4572e 0%,#f3a712 100%)",
    cta: "+ Publicar anuncio gratis",
    href: "/dashboard",
    img: "\u{1F455}",
  },
  {
    title: "Tecnolog\u00EDa al mejor precio",
    sub: "Celulares, laptops y m\u00E1s. Encuentra ofertas de vendedores verificados.",
    bg: "linear-gradient(120deg,#2e86ab 0%,#1a3a5c 100%)",
    cta: "Ver Electr\u00F3nica",
    href: "/",
    img: "\u{1F4F1}",
  },
  {
    title: "Renueva tu hogar",
    sub: "Muebles, decoraci\u00F3n y electrodom\u00E9sticos con pago seguro por Pago Link.",
    bg: "linear-gradient(120deg,#1c7c54 0%,#a8e063 100%)",
    cta: "Ver Hogar",
    href: "/",
    img: "\u{1FA91}",
  },
];

export default function Home() {
  const [listings, setListings] = useState<IListing[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setSlide((s) => (s + 1) % SLIDES.length),
      5000
    );
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goSlide = (i: number) => { setSlide(i); startTimer(); };

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "Todas") params.set("category", category);
    api<{ listings: IListing[] }>(\`/api/listings?\${params.toString()}\`)
      .then((res) => setListings(res.listings))
      .catch(() => setListings([]));
  }, [category, query]);

  const total = useMemo(() => listings.length, [listings.length]);
  const s = SLIDES[slide];

  return (
    <main>
      <section className="heroBanner" style={{ background: s.bg }}>
        <div className="heroBannerContent">
          <div className="heroBannerEmoji">{s.img}</div>
          <h1 className="heroBannerTitle">{s.title}</h1>
          <p className="heroBannerSub">{s.sub}</p>
          <Link href={s.href} className="publishCta">{s.cta}</Link>
        </div>
        <div className="heroBannerSearch">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="\uD83D\uDD0D  Buscar productos..."
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Todas</option>
            {CATEGORIES.map((cat) => (<option key={cat}>{cat}</option>))}
          </select>
        </div>
        <button className="carBtn carPrev heroCar" onClick={() => goSlide((slide - 1 + SLIDES.length) % SLIDES.length)} aria-label="Anterior" type="button">&#8249;</button>
        <button className="carBtn carNext heroCar" onClick={() => goSlide((slide + 1) % SLIDES.length)} aria-label="Siguiente" type="button">&#8250;</button>
        <div className="carDots heroCarDots">
          {SLIDES.map((_, i) => (<span key={i} className={\`carDot\${i === slide ? " active" : ""}\`} onClick={() => goSlide(i)} />))}
        </div>
      </section>

      <section className="container">
        <div className="catBanners">
          {CAT_META.map(({ label, icon, bg, color }) => (
            <button
              key={label}
              className={\`catBanner\${category === label ? " active" : ""}\`}
              style={{ background: bg, borderColor: category === label ? color : "transparent" }}
              onClick={() => setCategory(category === label ? "Todas" : label)}
            >
              <span className="catIcon">{icon}</span>
              <span className="catLabel" style={{ color }}>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="sectionHeader">
          <h2>{category === "Todas" ? "Todos los anuncios" : category}</h2>
          <span className="chip">{total} anuncios</span>
        </div>
        <div className="cards">
          {listings.length === 0 && (<p className="muted">No hay anuncios en esta categor\u00EDa todav\u00EDa.</p>)}
          {listings.map((listing) => (<ListingCard key={listing._id} listing={listing} />))}
        </div>
      </section>
    </main>
  );
}
`;

writeFileSync("app/page.tsx", content, "utf8");
console.log("page.tsx written OK");
