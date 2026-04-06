"use client";

import { useState } from "react";

type Props = {
  draft: string;
  onSend: (message: string) => void;
  onClose: () => void;
  sending: boolean;
};

export default function DraftReviewModal({ draft, onSend, onClose, sending }: Props) {
  const [message, setMessage] = useState(draft);

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-6" data-testid="draft-review-modal">
      <div className="card w-full max-w-lg space-y-6">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">Revisar mensaje</h3>
          <p className="text-sm text-muted mt-1">Edita el mensaje antes de enviarlo a tus clientes.</p>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-border rounded p-4 text-sm text-foreground leading-relaxed bg-transparent focus:border-accent focus:outline-none resize-none transition-colors"
          rows={8}
          data-testid="draft-textarea"
        />

        <div className="flex gap-3 justify-end pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="btn-ghost text-sm"
            disabled={sending}
            data-testid="cancel-draft"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSend(message)}
            disabled={!message.trim() || sending}
            className="btn-primary text-sm disabled:opacity-40 disabled:hover:transform-none"
            data-testid="send-draft"
          >
            {sending ? "Enviando..." : "Enviar a clientes"}
          </button>
        </div>
      </div>
    </div>
  );
}
