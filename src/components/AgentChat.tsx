"use client";

import { useState } from "react";
import type { SiteTask } from "@/lib/supabase";

type Props = {
  projectId: string;
  task?: SiteTask;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function AgentChat({ projectId, task }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          message: userMessage,
          task_context: task
            ? {
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                category: task.category,
              }
            : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error al comunicarse con el agente." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error de conexión." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-border mt-4 pt-4" data-testid="agent-chat">
      <p className="section-label mb-3">Chat con el agente</p>

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto" data-testid="chat-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`chat-${msg.role}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  msg.role === "user"
                    ? "bg-accent text-white"
                    : "bg-[#F0F0EE] text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start" data-testid="chat-loading">
              <div className="bg-[#F0F0EE] px-3 py-2 rounded-lg text-sm text-muted">
                Pensando...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Escribe al agente..."
          className="flex-1 border border-border rounded px-3 py-2 text-sm text-foreground bg-transparent focus:border-accent focus:outline-none"
          disabled={loading}
          data-testid="chat-input"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
          data-testid="chat-send"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
