"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import { api } from "@/lib/client";
import { IHeroSlide, IListing } from "@/types";
import { DEFAULT_HERO_SLIDES } from "@/lib/heroSlides";

const CAT_META = [
  { label: "Ropa", icon: "👕", bg: "#fff4e6", color: "#a84800" },
  { label: "Electrónica", icon: "📱", bg: "#e8f4ff", color: "#00508a" },
  { label: "Hogar", icon: "🪑", bg: "#e8fff2", color: "#00663e" },
] as const;

interface Props {
  initialQuery: string;
  initialCategory: string;
}

export default function HomePageClient({ initialQuery, initialCategory }: Props) {
  const [listings, setListings] = useState<IListing[]>([]);
  const [slides, setSlides] = useState<IHeroSlide[]>([...DEFAULT_HERO_SLIDES]);
  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSlide((current) => (current + 1) % slides.length), 5000);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  const goSlide = (index: number) => {
    setSlide(index);
    startTimer();
  };

  useEffect(() => {
    api<{ slides: IHeroSlide[] }>("/api/hero-slides")
      .then((res) => {
        if (res.slides.length) {
          setSlides(res.slides);
        }
      })
      .catch(() => setSlides([...DEFAULT_HERO_SLIDES]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (initialQuery.trim()) params.set("q", initialQuery.trim());
    if (initialCategory !== "Todas") params.set("category", initialCategory);
    api<{ listings: IListing[] }>(`/api/listings?${params.toString()}`)
      .then((res) => setListings(res.listings))
      .catch(() => setListings([]));
  }, [initialCategory, initialQuery]);

  const total = useMemo(() => listings.length, [listings.length]);
  const currentSlide = slides[slide] || slides[0];

  return (
    <main>
      <section
        className="heroBanner"
        style={{
          backgroundImage: `linear-gradient(rgba(18, 38, 32, 0.38), rgba(18, 38, 32, 0.38)), url(${currentSlide.image})`,
        }}
      >
        <div className="heroBannerContent">
          <h1 className="heroBannerTitle">{currentSlide.title}</h1>
          <p className="heroBannerSub">{currentSlide.subtitle}</p>
          <a href="/dashboard" className="publishCta">
            + Publicar anuncio gratis
          </a>
        </div>
        <button
          className="carBtn carPrev heroCar"
          onClick={() => goSlide((slide - 1 + slides.length) % slides.length)}
          aria-label="Anterior"
          type="button"
        >
          &#8249;
        </button>
        <button
          className="carBtn carNext heroCar"
          onClick={() => goSlide((slide + 1) % slides.length)}
          aria-label="Siguiente"
          type="button"
        >
          &#8250;
        </button>
        <div className="carDots heroCarDots">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`carDot${index === slide ? " active" : ""}`}
              onClick={() => goSlide(index)}
            />
          ))}
        </div>
      </section>

      <section className="container">
        <div className="catBanners">
          {CAT_META.map(({ label, icon, bg, color }) => (
            <button
              key={label}
              className={`catBanner${initialCategory === label ? " active" : ""}`}
              style={{ background: bg, borderColor: initialCategory === label ? color : "transparent" }}
              onClick={() => {
                const params = new URLSearchParams();
                if (initialQuery.trim()) params.set("q", initialQuery.trim());
                const nextCategory = initialCategory === label ? "Todas" : label;
                if (nextCategory !== "Todas") params.set("category", nextCategory);
                router.push(`/${params.toString() ? `?${params.toString()}` : ""}`);
              }}
            >
              <span className="catIcon">{icon}</span>
              <span className="catLabel" style={{ color }}>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="sectionHeader">
          <h2>{initialCategory === "Todas" ? "Todos los anuncios" : initialCategory}</h2>
          <span className="chip">{total} anuncios</span>
        </div>
        <div className="cards">
          {listings.length === 0 && (
            <p className="muted">No hay anuncios en esta categoría todavía.</p>
          )}
          {listings.map((listing) => {
            const key = (listing as any).id || listing._id;
            return <ListingCard key={key} listing={listing} />;
          })}
        </div>
      </section>
    </main>
  );
}