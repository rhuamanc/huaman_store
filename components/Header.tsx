"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LogoH from "@/components/LogoH";
import { api } from "@/lib/client";
import { CATEGORIES, IUserSafe } from "@/types";

export default function Header() {
  const [user, setUser] = useState<IUserSafe | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchCategory, setSearchCategory] = useState("Todas");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setSearchText(searchParams.get("q") || "");
    setSearchCategory(searchParams.get("category") || "Todas");
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user: IUserSafe | null }) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();

    if (searchText.trim()) {
      params.set("q", searchText.trim());
    }

    if (searchCategory !== "Todas") {
      params.set("category", searchCategory);
    }

    router.push(`/${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const initial = user?.name?.trim().charAt(0).toUpperCase() || "H";

  return (
    <header className="topBar">
      <div className="container topBarInner">
        <LogoH />
        <form className="topSearch" onSubmit={submitSearch}>
          <div className="fieldCol">
            <label className="fieldLabel fieldLabelLight" htmlFor="header-search">Buscar</label>
            <input
              id="header-search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Buscar productos..."
            />
          </div>
          <div className="fieldCol">
            <label className="fieldLabel fieldLabelLight" htmlFor="header-category">Categoría</label>
            <select
              id="header-category"
              value={searchCategory}
              onChange={(event) => setSearchCategory(event.target.value)}
            >
              <option>Todas</option>
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <button className="topSearchBtn" type="submit">
            Buscar
          </button>
        </form>
        <nav className="row gap center">
          {!user && <Link href="/login">Ingresar</Link>}
          <Link href="/dashboard" className="headerPublishBtn">
            + Publicar anuncio
          </Link>
          <div className="menuShell" ref={menuRef}>
            <button
              className="iconCircle menuTrigger"
              type="button"
              aria-label="Abrir menú"
              onClick={() => {
                setMenuOpen((open) => !open);
                setProfileOpen(false);
              }}
            >
              <span />
              <span />
              <span />
            </button>
            {menuOpen && (
              <div className="dropdownPanel">
                <form className="mobileSearchForm" style={{ display: "none" }} onSubmit={(e) => { setMenuOpen(false); submitSearch(e); }}>
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Buscar productos..."
                  />
                  <button type="submit">🔍</button>
                </form>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                  + Publicar anuncio
                </Link>
                {!user && <Link href="/login" onClick={() => setMenuOpen(false)}>Ingresar</Link>}
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                  Mis anuncios
                </Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)}>
                  Mi perfil
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}>
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>
          {user && (
            <div className="menuShell" ref={profileRef}>
              <button
                className="avatarBtn"
                type="button"
                aria-label="Abrir perfil"
                onClick={() => {
                  setProfileOpen((open) => !open);
                  setMenuOpen(false);
                }}
              >
                {initial}
              </button>
              {profileOpen && (
                <div className="dropdownPanel profilePanel">
                  <div className="profileMeta">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link href="/profile" onClick={() => setProfileOpen(false)}>
                    Mi perfil
                  </Link>
                  <button type="button" className="dropdownAction" onClick={logout}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
