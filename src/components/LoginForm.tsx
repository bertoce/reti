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
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const supabase = createAuthClient();
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error }) => {
          if (!error) {
            window.location.replace("/dashboard");
          } else {
            console.error("[login] Failed to set session:", error);
            setError("Error al iniciar sesión");
          }
        });
      }
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
      <div className="card text-center py-12" data-testid="login-success">
        <div className="w-10 h-10 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-base font-semibold text-foreground">Revisa tu correo</p>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          Enviamos un enlace de acceso a<br />
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" data-testid="login-form">
      <div>
        <label htmlFor="email" className="section-label block mb-3">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="input-editorial"
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
        className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
        data-testid="login-submit"
      >
        {loading ? "Enviando..." : "Enviar enlace de acceso"}
      </button>
    </form>
  );
}
