"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createAuthClient } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle magic link token in URL hash (implicit flow)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const supabase = createAuthClient();
      // Supabase client auto-detects the hash and sets the session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace("/dashboard");
        }
      });
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Error al enviar el enlace");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-3" data-testid="login-success">
        <p className="text-base font-medium text-foreground">Revisa tu correo</p>
        <p className="text-sm text-muted">
          Enviamos un enlace de acceso a <strong>{email}</strong>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
      <div>
        <label htmlFor="email" className="section-label mb-2 block">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="w-full border-b border-border py-3 text-sm text-foreground bg-transparent focus:border-accent focus:outline-none transition-colors"
          autoFocus
          data-testid="email-input"
        />
      </div>

      {error && (
        <p className="text-sm text-danger" data-testid="login-error">{error}</p>
      )}

      <button
        type="submit"
        disabled={!email.trim() || loading}
        className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        data-testid="login-submit"
      >
        {loading ? "Enviando..." : "Enviar enlace de acceso"}
      </button>
    </form>
  );
}
