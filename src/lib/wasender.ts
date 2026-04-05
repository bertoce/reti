// WASenderApi client — send messages and download media
// Docs: https://wasenderapi.com/api-docs

const WASENDER_BASE_URL = "https://app.wasenderapi.com/api";

function getHeaders() {
  const apiKey = process.env.WASENDER_API_KEY;
  if (!apiKey) throw new Error("Missing WASENDER_API_KEY");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function getSessionId() {
  const sessionId = process.env.WASENDER_SESSION_ID;
  if (!sessionId) throw new Error("Missing WASENDER_SESSION_ID");
  return sessionId;
}

// ============================================================
// Send a text message via WhatsApp
// ============================================================
export async function sendWhatsAppMessage(to: string, text: string) {
  const sessionId = getSessionId();
  const response = await fetch(
    `${WASENDER_BASE_URL}/send-message/${sessionId}`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        to,
        type: "text",
        text,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[wasender] Failed to send message:", error);
    throw new Error(`WASenderApi send failed: ${response.status}`);
  }

  return response.json();
}

// ============================================================
// Download media from a WhatsApp message
// Returns the raw buffer and content type
// ============================================================
export async function downloadMedia(messageId: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const sessionId = getSessionId();
  const response = await fetch(
    `${WASENDER_BASE_URL}/download-media/${sessionId}/${messageId}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[wasender] Failed to download media:", error);
    throw new Error(`WASenderApi download failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  };
}

// ============================================================
// Verify webhook signature
// ============================================================
export function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  const secret = process.env.WASENDER_WEBHOOK_SECRET;

  // If no secret configured, skip verification (dev mode)
  if (!secret) return true;

  // If secret is set but no signature provided, reject
  if (!signature) return false;

  // WASenderApi sends the secret as the signature
  return signature === secret;
}

// ============================================================
// Parse incoming webhook payload
// ============================================================
export type IncomingMessage = {
  messageId: string;
  from: string;        // sender phone (E.164)
  type: "text" | "image" | "voice" | "document";
  text?: string;       // text content (for text messages)
  caption?: string;    // caption (for image messages)
  hasMedia: boolean;
};

export function parseWebhookPayload(body: Record<string, unknown>): IncomingMessage | null {
  try {
    // WASenderApi webhook payload structure
    // Adapt this based on actual payload — structure may vary
    const message = body.message as Record<string, unknown> | undefined;
    if (!message) return null;

    const key = message.key as Record<string, unknown> | undefined;
    const messageContent = message.message as Record<string, unknown> | undefined;

    if (!key || !messageContent) return null;

    // Skip outgoing messages
    if (key.fromMe) return null;

    const from = (key.remoteJid as string)?.replace("@s.whatsapp.net", "") || "";
    const messageId = (key.id as string) || "";

    // Determine message type and content
    if (messageContent.conversation || messageContent.extendedTextMessage) {
      return {
        messageId,
        from,
        type: "text",
        text: (messageContent.conversation as string) ||
              ((messageContent.extendedTextMessage as Record<string, unknown>)?.text as string) || "",
        hasMedia: false,
      };
    }

    if (messageContent.imageMessage) {
      const imageMsg = messageContent.imageMessage as Record<string, unknown>;
      return {
        messageId,
        from,
        type: "image",
        caption: (imageMsg.caption as string) || undefined,
        hasMedia: true,
      };
    }

    if (messageContent.audioMessage) {
      return {
        messageId,
        from,
        type: "voice",
        hasMedia: true,
      };
    }

    if (messageContent.documentMessage) {
      return {
        messageId,
        from,
        type: "document",
        caption: ((messageContent.documentMessage as Record<string, unknown>).caption as string) || undefined,
        hasMedia: true,
      };
    }

    return null;
  } catch (error) {
    console.error("[wasender] Failed to parse webhook payload:", error);
    return null;
  }
}
