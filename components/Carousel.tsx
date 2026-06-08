"use client";

import { useState } from "react";

const FALLBACK =
  "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=1200&auto=format&fit=crop";

interface Props {
  images: string[];
  alt: string;
  height?: number;
  zoomable?: boolean;
}

export default function Carousel({ images, alt, height = 260, zoomable = false }: Props) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const imgs = images.length ? images : [FALLBACK];

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIdx((i) => (i - 1 + imgs.length) % imgs.length);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIdx((i) => (i + 1) % imgs.length);
  };

  return (
    <>
      <div className="carousel" style={{ height }}>
        <img src={imgs[idx]} alt={`${alt} ${idx + 1}`} className="carouselImg" />
        {zoomable && (
          <button
            className="carZoomBtn"
            onClick={() => setLightbox(true)}
            aria-label="Ver en pantalla completa"
            type="button"
          >
            🔍
          </button>
        )}
        {imgs.length > 1 && (
          <>
            <button className="carBtn carPrev" onClick={prev} aria-label="Anterior" type="button">
              ‹
            </button>
            <button className="carBtn carNext" onClick={next} aria-label="Siguiente" type="button">
              ›
            </button>
            <div className="carDots">
              {imgs.map((_, i) => (
                <span
                  key={i}
                  className={`carDot${i === idx ? " active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIdx(i);
                  }}
                />
              ))}
            </div>
            <span className="carCounter">
              {idx + 1}/{imgs.length}
            </span>
          </>
        )}
      </div>

      {lightbox && (
        <div className="lightboxOverlay" onClick={() => setLightbox(false)}>
          <button
            className="lightboxClose"
            onClick={() => setLightbox(false)}
            aria-label="Cerrar"
            type="button"
          >
            ✕
          </button>
          {imgs.length > 1 && (
            <button className="carBtn carPrev lightboxNav" onClick={prev} aria-label="Anterior" type="button">
              ‹
            </button>
          )}
          <img
            src={imgs[idx]}
            alt={`${alt} ${idx + 1}`}
            className="lightboxImg"
            onClick={(e) => e.stopPropagation()}
          />
          {imgs.length > 1 && (
            <button className="carBtn carNext lightboxNav" onClick={next} aria-label="Siguiente" type="button">
              ›
            </button>
          )}
          {imgs.length > 1 && (
            <span className="lightboxCounter">{idx + 1} / {imgs.length}</span>
          )}
        </div>
      )}
    </>
  );
}
