"use client";

import { useState, useEffect, useCallback } from "react";
import { type Client } from "@/lib/supabase";
import ClientList from "./ClientList";
import ClientForm from "./ClientForm";
import DraftReviewModal from "./DraftReviewModal";

type Props = {
  projectId: string;
};

type TemplateType = "weekly" | "milestone" | "custom";

export default function ClientUpdatesTab({ projectId }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [draftText, setDraftText] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients?project_id=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleAddClient = async (data: { name: string; phone: string; unit: string }) => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, ...data }),
      });
      if (res.ok) {
        setShowClientForm(false);
        await fetchClients();
      }
    } catch (err) {
      console.error("Failed to add client:", err);
    }
  };

  const toggleClientSelection = (id: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllClients = () => {
    const optedIn = clients.filter((c) => c.opted_in).map((c) => c.id);
    setSelectedClientIds(optedIn);
  };

  const generateDraft = async (templateType: TemplateType) => {
    setGenerating(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/messages/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, template_type: templateType }),
      });
      if (res.ok) {
        const data = await res.json();
        setDraftText(data.text);
      }
    } catch (err) {
      console.error("Failed to generate draft:", err);
    } finally {
      setGenerating(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (selectedClientIds.length === 0) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          client_ids: selectedClientIds,
          message,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLastResult({ sent: data.sent, failed: data.failed });
        setDraftText(null);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const templates: { type: TemplateType; label: string; description: string }[] = [
    { type: "weekly", label: "Avance semanal", description: "Resumen de la semana con fotos" },
    { type: "milestone", label: "Hito alcanzado", description: "Anuncio de logro importante" },
    { type: "custom", label: "Mensaje personalizado", description: "Mensaje libre" },
  ];

  return (
    <div className="px-4 pt-4 space-y-6" data-testid="client-updates-tab">
      {/* Client list section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Clientes</p>
          <div className="flex gap-2">
            {clients.length > 0 && (
              <button onClick={selectAllClients} className="text-xs text-accent" data-testid="select-all-clients">
                Seleccionar todos
              </button>
            )}
            <button
              onClick={() => setShowClientForm(true)}
              className="text-xs text-accent font-medium"
              data-testid="add-client-btn"
            >
              + Agregar
            </button>
          </div>
        </div>

        {showClientForm && (
          <ClientForm
            onSubmit={handleAddClient}
            onClose={() => setShowClientForm(false)}
          />
        )}

        <ClientList
          clients={clients}
          selectedIds={selectedClientIds}
          onToggleSelect={toggleClientSelection}
        />
      </div>

      {/* Template buttons */}
      <div>
        <p className="section-label mb-3">Enviar actualización</p>
        <div className="space-y-2">
          {templates.map((tpl) => (
            <button
              key={tpl.type}
              onClick={() => generateDraft(tpl.type)}
              disabled={generating || selectedClientIds.length === 0}
              className="w-full text-left p-3 bg-card border border-border rounded-lg hover:border-accent transition-colors disabled:opacity-40"
              data-testid={`template-${tpl.type}`}
            >
              <p className="text-sm font-medium text-foreground">{tpl.label}</p>
              <p className="text-xs text-muted">{tpl.description}</p>
            </button>
          ))}
        </div>
        {selectedClientIds.length === 0 && clients.length > 0 && (
          <p className="text-xs text-warning mt-2">Selecciona al menos un cliente para enviar</p>
        )}
        {generating && (
          <p className="text-xs text-muted mt-2" data-testid="generating-draft">Generando borrador...</p>
        )}
      </div>

      {/* Result feedback */}
      {lastResult && (
        <div className="p-3 bg-success-light rounded-lg" data-testid="send-result">
          <p className="text-sm text-success font-medium">
            Enviado a {lastResult.sent} cliente{lastResult.sent !== 1 ? "s" : ""}
            {lastResult.failed > 0 && ` · ${lastResult.failed} fallido${lastResult.failed !== 1 ? "s" : ""}`}
          </p>
        </div>
      )}

      {/* Draft review modal */}
      {draftText && (
        <DraftReviewModal
          draft={draftText}
          onSend={sendMessage}
          onClose={() => setDraftText(null)}
          sending={sending}
        />
      )}
    </div>
  );
}
