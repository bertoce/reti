"use client";

import { type Client } from "@/lib/supabase";

type Props = {
  clients: Client[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
};

export default function ClientList({ clients, selectedIds, onToggleSelect }: Props) {
  if (clients.length === 0) {
    return (
      <p className="text-sm text-muted py-4 text-center" data-testid="no-clients">
        No hay clientes. Agrega clientes para enviar actualizaciones.
      </p>
    );
  }

  return (
    <div className="space-y-2" data-testid="client-list">
      {clients.map((client) => (
        <label
          key={client.id}
          className="flex items-center gap-3 p-3 card-interactive cursor-pointer"
          data-testid="client-item"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(client.id)}
            onChange={() => onToggleSelect(client.id)}
            className="w-4 h-4 accent-accent"
            data-testid="client-checkbox"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
            <p className="text-xs text-muted">{client.phone}{client.unit ? ` · ${client.unit}` : ""}</p>
          </div>
          {!client.opted_in && (
            <span className="text-xs text-warning" data-testid="opted-out-badge">No participa</span>
          )}
        </label>
      ))}
    </div>
  );
}
