"use client";

import { type SiteMessage } from "@/lib/supabase";
import { formatTime, formatDate } from "@/lib/format";

type Props = {
  messages: SiteMessage[];
  residenteName: string;
};

export default function ChatLog({ messages, residenteName }: Props) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-16 px-6" data-testid="empty-chat">
        <p className="text-sm text-muted">Sin mensajes</p>
      </div>
    );
  }

  const grouped = groupByDate(messages);

  return (
    <div className="px-6 py-4 space-y-6" data-testid="chat-log">
      {Object.entries(grouped).map(([date, msgs]) => (
        <div key={date}>
          {/* Date divider */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="section-label" data-testid="date-divider">{date}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Messages */}
          <div className="space-y-3">
            {msgs.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                residenteName={residenteName}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageBubble({
  message,
  residenteName,
}: {
  message: SiteMessage;
  residenteName: string;
}) {
  const isInbound = message.direction === "inbound";

  return (
    <div
      className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
      data-testid={isInbound ? "message-inbound" : "message-outbound"}
    >
      <div
        className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
          isInbound
            ? "card rounded-bl-none"
            : "bg-accent text-white rounded rounded-br-none"
        }`}
      >
        {/* Sender */}
        {isInbound && (
          <p className="text-xs font-medium text-accent mb-1.5 tracking-tight" data-testid="sender-name">
            {residenteName}
          </p>
        )}

        {/* Type indicator */}
        {message.message_type === "voice" && (
          <p className={`text-xs mb-1.5 ${isInbound ? "text-muted" : "text-white/60"}`}>
            Nota de voz
          </p>
        )}

        {message.message_type === "image" && (
          <p className={`text-xs mb-1.5 ${isInbound ? "text-muted" : "text-white/60"}`}>
            Foto
          </p>
        )}

        {/* Media */}
        {message.media_urls && message.media_urls.length > 0 && (
          <div className="mb-2" data-testid="message-media">
            {message.media_urls.map((url, i) => (
              <div key={i} className="rounded overflow-hidden bg-subtle mb-1.5">
                <img src={url} alt="" className="w-full max-h-48 object-cover photo-warm" />
              </div>
            ))}
          </div>
        )}

        {/* Text */}
        {message.content && (
          <p className={isInbound ? "text-foreground" : "text-white"}>
            {message.content}
          </p>
        )}

        {/* Time */}
        <p className={`text-xs mt-1.5 ${isInbound ? "text-muted/50" : "text-white/40"}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

function groupByDate(messages: SiteMessage[]): Record<string, SiteMessage[]> {
  const groups: Record<string, SiteMessage[]> = {};
  for (const msg of messages) {
    const date = formatDate(msg.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
  }
  return groups;
}
