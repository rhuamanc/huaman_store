"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client";

interface Conv {
  _id: string;
  listing: { _id: string; title: string };
  buyer: { _id: string; name: string };
  seller: { _id: string; name: string };
}

interface Msg {
  _id: string;
  text: string;
  sender: { _id: string; name: string };
  createdAt: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [active, setActive] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ conversations: Conv[] }>("/api/conversations")
      .then((res) => {
        setConversations(res.conversations);
        if (res.conversations.length) {
          setActive(res.conversations[0]._id);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = "/login?next=/chat";
          return;
        }
        setError(err instanceof Error ? err.message : "No se pudo cargar chats");
      });
  }, []);

  useEffect(() => {
    if (!active) return;
    api<{ messages: Msg[] }>(`/api/conversations/${active}/messages`)
      .then((res) => setMessages(res.messages))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = "/login?next=/chat";
          return;
        }
        setError(err instanceof Error ? err.message : "No se pudo cargar mensajes");
      });
  }, [active]);

  const send = async () => {
    if (!active || !text.trim()) return;
    try {
      const res = await api<{ message: Msg }>(`/api/conversations/${active}/messages`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setMessages((old) => [...old, res.message]);
      setText("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = "/login?next=/chat";
        return;
      }
      setError(err instanceof Error ? err.message : "No se pudo enviar mensaje");
    }
  };

  return (
    <main className="container section chatLayout">
      <aside className="card chatList">
        <h2>Chats</h2>
        {conversations.map((c) => (
          <button
            key={c._id}
            className={`chatItem ${active === c._id ? "active" : ""}`}
            onClick={() => setActive(c._id)}
          >
            {c.listing.title}
          </button>
        ))}
      </aside>
      <section className="card chatBox">
        <h2>Conversación</h2>
        {error && <p className="error">{error}</p>}
        <div className="messages">
          {messages.map((m) => (
            <div className="msg" key={m._id}>
              <strong>{m.sender.name}</strong>
              <p>{m.text}</p>
            </div>
          ))}
        </div>
        <div className="row gap">
          <div className="fieldCol chatInputCol">
            <label className="fieldLabel" htmlFor="chat-message">Mensaje</label>
            <input id="chat-message" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje" />
          </div>
          <button className="cta" onClick={send}>Enviar</button>
        </div>
      </section>
    </main>
  );
}
