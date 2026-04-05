"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userEmail: string;
};

export default function ProjectSetup({ userEmail }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [residenteName, setResidenteName] = useState("");
  const [residentePhone, setResidentePhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim() && residenteName.trim() && residentePhone.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          developer_email: userEmail,
          residente_name: residenteName.trim(),
          residente_phone: residentePhone.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/project/${data.project.id}/overview`);
      } else {
        const data = await res.json();
        setError(data.error || "Error al crear el proyecto");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="project-setup-form">
      <div>
        <label className="section-label mb-2 block">Nombre del proyecto</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Casa Reforma 15"
          className="w-full border-b border-border py-3 text-sm text-foreground bg-transparent focus:border-accent focus:outline-none"
          data-testid="project-name-input"
        />
      </div>

      <div>
        <label className="section-label mb-2 block">Nombre del residente</label>
        <input
          type="text"
          value={residenteName}
          onChange={(e) => setResidenteName(e.target.value)}
          placeholder="Juan Pérez"
          className="w-full border-b border-border py-3 text-sm text-foreground bg-transparent focus:border-accent focus:outline-none"
          data-testid="residente-name-input"
        />
      </div>

      <div>
        <label className="section-label mb-2 block">WhatsApp del residente</label>
        <input
          type="tel"
          value={residentePhone}
          onChange={(e) => setResidentePhone(e.target.value)}
          placeholder="+521234567890"
          className="w-full border-b border-border py-3 text-sm text-foreground bg-transparent focus:border-accent focus:outline-none"
          data-testid="residente-phone-input"
        />
        <p className="text-xs text-muted mt-1">Con código de país. Ejemplo: +521234567890</p>
      </div>

      {error && (
        <p className="text-sm text-danger" data-testid="project-setup-error">{error}</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        data-testid="create-project-submit"
      >
        {loading ? "Creando..." : "Crear proyecto"}
      </button>
    </form>
  );
}
