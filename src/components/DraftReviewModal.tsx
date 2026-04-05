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
    <div className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4" data-testid="draft-review-modal">
      <div className="bg-card rounded-lg w-full max-w-lg p-6 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Revisar mensaje</h3>
        <p className="text-xs text-muted">Edita el mensaje antes de enviarlo a tus clientes.</p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-border rounded p-3 text-sm text-foreground bg-transparent focus:border-accent focus:outline-none resize-none"
          rows={8}
          data-testid="draft-textarea"
        />

        <div className="flex gap-2 justify-end">
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
            className="btn-primary text-sm py-2 px-4 disabled:opacity-40"
            data-testid="send-draft"
          >
            {sending ? "Enviando..." : "Enviar a clientes"}
          </button>
        </div>
      </div>
    </div>
  );
}
