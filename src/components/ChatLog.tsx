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
      <p className="text-center text-sm text-muted py-8" data-testid="empty-chat">
        Sin mensajes
      </p>
    );
  }

  // Group messages by date
  const grouped = groupByDate(messages);

  return (
    <div className="space-y-4 pb-4" data-testid="chat-log">
      {Object.entries(grouped).map(([date, msgs]) => (
        <div key={date}>
          {/* Date divider */}
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted shrink-0" data-testid="date-divider">{date}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Messages */}
          <div className="space-y-2 px-4">
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
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
          isInbound
            ? "bg-card border border-border rounded-bl-md"
            : "bg-accent text-white rounded-br-md"
        }`}
      >
        {/* Sender label for inbound */}
        {isInbound && (
          <p className="text-xs font-medium text-accent mb-1" data-testid="sender-name">
            {residenteName}
          </p>
        )}

        {/* Message type indicator */}
        {message.message_type === "voice" && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">🎙️</span>
            <span className={`text-xs ${isInbound ? "text-muted" : "text-white/70"}`}>
              Nota de voz
            </span>
          </div>
        )}

        {message.message_type === "image" && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">📷</span>
            <span className={`text-xs ${isInbound ? "text-muted" : "text-white/70"}`}>
              Foto
            </span>
          </div>
        )}

        {/* Media thumbnails */}
        {message.media_urls && message.media_urls.length > 0 && (
          <div className="mb-2" data-testid="message-media">
            {message.media_urls.map((url, i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-gray-100 mb-1">
                <img src={url} alt="" className="w-full max-h-48 object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <p className={`text-sm ${isInbound ? "text-foreground" : "text-white"}`}>
            {message.content}
          </p>
        )}

        {/* Timestamp */}
        <p
          className={`text-xs mt-1 ${
            isInbound ? "text-muted" : "text-white/50"
          }`}
        >
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
