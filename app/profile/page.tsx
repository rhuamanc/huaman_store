"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client";
import { IUserSafe } from "@/types";

export default function ProfilePage() {
  const [user, setUser] = useState<IUserSafe | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ user: IUserSafe | null }>("/api/auth/me")
      .then((res) => {
        if (!res.user) {
          window.location.href = "/login?next=/profile";
          return;
        }
        setUser(res.user);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = "/login?next=/profile";
          return;
        }
        setError(err instanceof Error ? err.message : "No se pudo cargar el perfil");
      });
  }, []);

  if (error) {
    return (
      <main className="container section narrow">
        <p className="error">{error}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container section narrow">
        <p>Cargando perfil...</p>
      </main>
    );
  }

  return (
    <main className="container section narrow">
      <section className="card profileCard">
        <div className="profileHero">
          <div className="avatarBig">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <h1>Mi perfil</h1>
            <p className="muted">Gestiona tu cuenta en Huaman.com</p>
          </div>
        </div>
        <div className="profileGrid">
          <div>
            <span className="profileLabel">Nombre</span>
            <strong>{user.name}</strong>
          </div>
          <div>
            <span className="profileLabel">Correo</span>
            <strong>{user.email}</strong>
          </div>
          <div>
            <span className="profileLabel">Rol</span>
            <strong>{user.role === "admin" ? "Administrador" : "Usuario"}</strong>
          </div>
          <div>
            <span className="profileLabel">Miembro desde</span>
            <strong>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
