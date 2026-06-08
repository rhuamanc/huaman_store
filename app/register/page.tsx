"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container section narrow">
      <form className="card form" onSubmit={submit}>
        <h1>Crear cuenta</h1>
        <label className="fieldLabel" htmlFor="register-name">Nombre</label>
        <input id="register-name" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <label className="fieldLabel" htmlFor="register-email">Correo</label>
        <input id="register-email" type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="fieldLabel" htmlFor="register-password">Contraseña</label>
        <input
          id="register-password"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button className="cta" disabled={loading} type="submit">
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
        <p className="small">
          ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
        </p>
      </form>
    </main>
  );
}
