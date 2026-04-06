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
    <div className="border-t border-border mt-6 pt-6" data-testid="agent-chat">
      <p className="section-label mb-4">Chat con el agente</p>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-56 overflow-y-auto" data-testid="chat-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`chat-${msg.role}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-accent text-white"
                    : "bg-subtle text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start" data-testid="chat-loading">
              <div className="bg-subtle px-4 py-2.5 rounded text-sm text-muted">
                <span className="animate-pulse">Pensando...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Escribe al agente..."
          className="flex-1 input-editorial"
          disabled={loading}
          data-testid="chat-input"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="btn-primary px-5 py-2.5 text-sm disabled:opacity-40 disabled:hover:transform-none"
          data-testid="chat-send"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
