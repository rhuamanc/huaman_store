"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container section narrow">
      <form className="card form" onSubmit={submit}>
        <h1>Ingresar a Huaman.com</h1>
        <label className="fieldLabel" htmlFor="login-email">Correo</label>
        <input id="login-email" type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="fieldLabel" htmlFor="login-password">Contraseña</label>
        <input
          id="login-password"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button className="cta" disabled={loading} type="submit">
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
