// WASenderApi client — send messages and download media
// Docs: https://wasenderapi.com/api-docs

const WASENDER_BASE_URL = "https://www.wasenderapi.com/api";

function getHeaders() {
  const apiKey = process.env.WASENDER_API_KEY;
  if (!apiKey) throw new Error("Missing WASENDER_API_KEY");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

// ============================================================
// Fetch with exponential backoff on 429 (rate limit)
// ============================================================
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status !== 429 || attempt === maxRetries) {
      return response;
    }

    // Parse Retry-After header or use exponential backoff
    const retryAfter = response.headers.get("Retry-After");
    const waitMs = retryAfter
      ? parseInt(retryAfter, 10) * 1000
      : Math.min(1000 * Math.pow(2, attempt), 30000);

    console.log(`[wasender] Rate limited (429), retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  // Should never reach here, but TypeScript needs it
  throw new Error("fetchWithRetry: exceeded max retries");
}

// ============================================================
// Send a text message via WhatsApp
// ============================================================
export async function sendWhatsAppMessage(to: string, text: string) {
  const response = await fetchWithRetry(
    `${WASENDER_BASE_URL}/send-message`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        to,
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
// Decrypt media from a WhatsApp message via WASenderApi
// Posts the raw media data from the webhook to /api/decrypt-media
// Returns a temporary public URL (valid ~1 hour) and the content type
// ============================================================
export async function decryptMedia(
  messageId: string,
  mediaData: Record<string, unknown>
): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  // Step 1: Call decrypt-media to get a temporary public URL
  const decryptResponse = await fetchWithRetry(
    `${WASENDER_BASE_URL}/decrypt-media`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        data: {
          messages: {
            key: { id: messageId },
            message: mediaData,
          },
        },
      }),
    }
  );

  if (!decryptResponse.ok) {
    const error = await decryptResponse.text();
    console.error("[wasender] Failed to decrypt media:", error);
    throw new Error(`WASenderApi decrypt failed: ${decryptResponse.status}`);
  }

  const decryptResult = await decryptResponse.json();
  const publicUrl = decryptResult.publicUrl || decryptResult.url;

  if (!publicUrl) {
    console.error("[wasender] No publicUrl in decrypt response:", JSON.stringify(decryptResult));
    throw new Error("WASenderApi decrypt returned no URL");
  }

  console.log("[wasender] Decrypted media URL:", publicUrl);

  // Step 2: Download the actual file from the temporary URL
  const fileResponse = await fetch(publicUrl);
  if (!fileResponse.ok) {
    throw new Error(`Failed to download decrypted media: ${fileResponse.status}`);
  }

  const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await fileResponse.arrayBuffer();
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
  mediaData?: Record<string, unknown>;  // raw media message data for decrypt-media API
  albumId?: string;             // album group ID (for multi-photo messages)
  albumExpectedCount?: number;  // expected number of images in the album
};

export function parseWebhookPayload(body: Record<string, unknown>): IncomingMessage | null {
  try {
    // WASenderApi sends: { event, sessionId, data: { messages: { key, message, ... } }, timestamp }
    // Only process "messages.received" events
    if (body.event !== "messages.received") return null;

    const data = body.data as Record<string, unknown> | undefined;
    if (!data) return null;

    const message = data.messages as Record<string, unknown> | undefined;
    if (!message) return null;

    const key = message.key as Record<string, unknown> | undefined;
    const messageContent = message.message as Record<string, unknown> | undefined;

    if (!key || !messageContent) return null;

    // Skip outgoing messages
    if (key.fromMe) return null;

    // WASenderApi uses LID format for remoteJid but provides senderPn with the real phone
    const from = (key.cleanedSenderPn as string) ||
                 (key.senderPn as string)?.replace("@s.whatsapp.net", "") ||
                 (key.remoteJid as string)?.replace("@s.whatsapp.net", "") || "";
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

      // Check for album (multi-photo) messages
      const albumMessage = messageContent.albumMessage as Record<string, unknown> | undefined;
      const albumId = albumMessage
        ? (albumMessage.albumId as string) || undefined
        : undefined;
      const albumExpectedCount = albumMessage
        ? (albumMessage.expectedImageCount as number) || undefined
        : undefined;

      return {
        messageId,
        from,
        type: "image",
        caption: (imageMsg.caption as string) || undefined,
        hasMedia: true,
        mediaData: { imageMessage: imageMsg },
        albumId,
        albumExpectedCount,
      };
    }

    if (messageContent.audioMessage) {
      const audioMsg = messageContent.audioMessage as Record<string, unknown>;
      return {
        messageId,
        from,
        type: "voice",
        hasMedia: true,
        mediaData: { audioMessage: audioMsg },
      };
    }

    if (messageContent.documentMessage) {
      const docMsg = messageContent.documentMessage as Record<string, unknown>;
      return {
        messageId,
        from,
        type: "document",
        caption: (docMsg.caption as string) || undefined,
        hasMedia: true,
        mediaData: { documentMessage: docMsg },
      };
    }

    return null;
  } catch (error) {
    console.error("[wasender] Failed to parse webhook payload:", error);
    return null;
  }
}
