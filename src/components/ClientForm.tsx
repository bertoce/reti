"use client";

import { useState } from "react";

type Props = {
  onSubmit: (data: { name: string; phone: string; unit: string }) => void;
  onClose: () => void;
};

export default function ClientForm({ onSubmit, onClose }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [unit, setUnit] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmit({ name: name.trim(), phone: phone.trim(), unit: unit.trim() });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3" data-testid="client-form">
      <h3 className="text-sm font-semibold text-foreground">Agregar cliente</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del cliente"
          className="w-full border-b border-border py-2 text-sm bg-transparent focus:border-accent focus:outline-none"
          data-testid="client-name-input"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Teléfono (con código de país)"
          className="w-full border-b border-border py-2 text-sm bg-transparent focus:border-accent focus:outline-none"
          data-testid="client-phone-input"
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unidad / Propiedad (opcional)"
          className="w-full border-b border-border py-2 text-sm bg-transparent focus:border-accent focus:outline-none"
          data-testid="client-unit-input"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!name.trim() || !phone.trim()}
            className="btn-primary text-sm py-2 px-4 disabled:opacity-40"
            data-testid="submit-client"
          >
            Agregar
          </button>
          <button type="button" onClick={onClose} className="btn-ghost text-sm" data-testid="cancel-client">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
