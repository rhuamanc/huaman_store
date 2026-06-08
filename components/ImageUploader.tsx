"use client";

import { useState } from "react";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function ImageUploader({ images, onChange }: Props) {
  const [urlInput, setUrlInput] = useState("");

  const addImageUrl = () => {
    if (!urlInput.trim()) return;
    onChange([...images, urlInput]);
    setUrlInput("");
  };

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
      <label htmlFor="urlInput" style={{ display: "block", marginBottom: "1rem", fontWeight: "bold" }}>
        URLs de imágenes:
      </label>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          id="urlInput"
          type="text"
          placeholder="https://ejemplo.com/imagen.jpg"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addImageUrl()}
          style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
        />
        <button
          type="button"
          onClick={addImageUrl}
          disabled={!urlInput.trim()}
          style={{
            padding: "0.5rem 1rem",
            background: urlInput.trim() ? "#333" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: urlInput.trim() ? "pointer" : "not-allowed",
          }}
        >
          Agregar
        </button>
      </div>

      {images.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <small style={{ color: "#666" }}>URLs agregadas:</small>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem" }}>
            {images.map((url, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem",
                  background: "#f5f5f5",
                  marginBottom: "0.5rem",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                  wordBreak: "break-all",
                }}
              >
                <span>{url}</span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  style={{
                    background: "#ff4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "3px",
                    padding: "0.25rem 0.5rem",
                    cursor: "pointer",
                    marginLeft: "0.5rem",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
