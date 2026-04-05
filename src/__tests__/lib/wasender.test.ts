import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  sendWhatsAppMessage,
  decryptMedia,
  verifyWebhookSignature,
  parseWebhookPayload,
  type IncomingMessage,
} from "@/lib/wasender";

describe("verifyWebhookSignature", () => {
  it("returns true when no secret is configured", () => {
    const original = process.env.WASENDER_WEBHOOK_SECRET;
    delete process.env.WASENDER_WEBHOOK_SECRET;

    expect(verifyWebhookSignature("payload", null)).toBe(true);

    process.env.WASENDER_WEBHOOK_SECRET = original;
  });

  it("returns false when secret is set but no signature provided", () => {
    expect(verifyWebhookSignature("payload", null)).toBe(false);
  });

  it("returns true when signature matches secret", () => {
    expect(verifyWebhookSignature("payload", "test-webhook-secret")).toBe(true);
  });

  it("returns false when signature does not match", () => {
    expect(verifyWebhookSignature("payload", "wrong-secret")).toBe(false);
  });
});

describe("parseWebhookPayload", () => {
  // Helper to wrap message data in WASenderApi's actual payload structure
  function wrapPayload(messages: Record<string, unknown>) {
    return {
      event: "messages.received",
      sessionId: "test-session",
      data: { messages },
      timestamp: Date.now(),
    };
  }

  it("parses a text message correctly", () => {
    const payload = wrapPayload({
      key: {
        remoteJid: "5212345678@lid",
        senderPn: "5212345678@s.whatsapp.net",
        cleanedSenderPn: "5212345678",
        fromMe: false,
        id: "msg-123",
      },
      message: {
        conversation: "Hoy terminamos el colado",
      },
    });

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.from).toBe("5212345678");
    expect(result!.type).toBe("text");
    expect(result!.text).toBe("Hoy terminamos el colado");
    expect(result!.hasMedia).toBe(false);
    expect(result!.messageId).toBe("msg-123");
  });

  it("parses an extended text message", () => {
    const payload = wrapPayload({
      key: {
        cleanedSenderPn: "5212345678",
        fromMe: false,
        id: "msg-456",
      },
      message: {
        extendedTextMessage: {
          text: "Falta material para la instalación",
        },
      },
    });

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("text");
    expect(result!.text).toBe("Falta material para la instalación");
  });

  it("parses an image message with caption and preserves mediaData", () => {
    const payload = wrapPayload({
      key: {
        cleanedSenderPn: "5212345678",
        fromMe: false,
        id: "msg-789",
      },
      message: {
        imageMessage: {
          caption: "Avance del segundo piso",
          mimetype: "image/jpeg",
          mediaKey: "abc123",
          url: "https://mmg.whatsapp.net/encrypted",
        },
      },
    });

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("image");
    expect(result!.caption).toBe("Avance del segundo piso");
    expect(result!.hasMedia).toBe(true);
    expect(result!.mediaData).toEqual({
      imageMessage: {
        caption: "Avance del segundo piso",
        mimetype: "image/jpeg",
        mediaKey: "abc123",
        url: "https://mmg.whatsapp.net/encrypted",
      },
    });
  });

  it("parses an image message without caption", () => {
    const payload = wrapPayload({
      key: {
        cleanedSenderPn: "5212345678",
        fromMe: false,
        id: "msg-101",
      },
      message: {
        imageMessage: {
          mimetype: "image/jpeg",
        },
      },
    });

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("image");
    expect(result!.caption).toBeUndefined();
    expect(result!.hasMedia).toBe(true);
    expect(result!.mediaData).toBeDefined();
  });

  it("parses a voice message and preserves mediaData", () => {
    const payload = wrapPayload({
      key: {
        cleanedSenderPn: "5212345678",
        fromMe: false,
        id: "msg-voice",
      },
      message: {
        audioMessage: {
          mimetype: "audio/ogg; codecs=opus",
          ptt: true,
          mediaKey: "voice-key-123",
          url: "https://mmg.whatsapp.net/encrypted-audio",
        },
      },
    });

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("voice");
    expect(result!.hasMedia).toBe(true);
    expect(result!.mediaData).toEqual({
      audioMessage: {
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
        mediaKey: "voice-key-123",
        url: "https://mmg.whatsapp.net/encrypted-audio",
      },
    });
  });

  it("parses a document message and preserves mediaData", () => {
    const payload = wrapPayload({
      key: {
        cleanedSenderPn: "5212345678",
        fromMe: false,
        id: "msg-doc",
      },
      message: {
        documentMessage: {
          caption: "Factura del proveedor",
          mimetype: "application/pdf",
          mediaKey: "doc-key-456",
        },
      },
    });

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("document");
    expect(result!.caption).toBe("Factura del proveedor");
    expect(result!.hasMedia).toBe(true);
    expect(result!.mediaData).toEqual({
      documentMessage: {
        caption: "Factura del proveedor",
        mimetype: "application/pdf",
        mediaKey: "doc-key-456",
      },
    });
  });

  it("skips outgoing messages (fromMe=true)", () => {
    const payload = wrapPayload({
      key: {
        cleanedSenderPn: "5212345678",
        fromMe: true,
        id: "msg-out",
      },
      message: {
        conversation: "Agent reply",
      },
    });

    const result = parseWebhookPayload(payload);
    expect(result).toBeNull();
  });

  it("returns null for empty payload", () => {
    expect(parseWebhookPayload({})).toBeNull();
  });

  it("returns null for non-messages.received events", () => {
    expect(parseWebhookPayload({ event: "session.status", data: {} })).toBeNull();
  });

  it("returns null for payload without data.messages", () => {
    expect(parseWebhookPayload({ event: "messages.received", data: {} })).toBeNull();
  });

  it("returns null for unrecognized message type", () => {
    const payload = wrapPayload({
      key: {
        cleanedSenderPn: "5212345678",
        fromMe: false,
        id: "msg-unknown",
      },
      message: {
        stickerMessage: { mimetype: "image/webp" },
      },
    });

    const result = parseWebhookPayload(payload);
    expect(result).toBeNull();
  });

  it("falls back to senderPn when cleanedSenderPn is missing", () => {
    const payload = wrapPayload({
      key: {
        senderPn: "5212345678@s.whatsapp.net",
        fromMe: false,
        id: "msg-fallback",
      },
      message: {
        conversation: "Test fallback",
      },
    });

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.from).toBe("5212345678");
  });

  it("falls back to remoteJid when senderPn is also missing", () => {
    const payload = wrapPayload({
      key: {
        remoteJid: "5212345678@s.whatsapp.net",
        fromMe: false,
        id: "msg-fallback2",
      },
      message: {
        conversation: "Test fallback 2",
      },
    });

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.from).toBe("5212345678");
  });
});

describe("sendWhatsAppMessage", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("calls the correct WASenderApi endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "sent" }),
    });

    await sendWhatsAppMessage("+5212345678", "✓ Tarea registrada");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://www.wasenderapi.com/api/send-message");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.to).toBe("+5212345678");
    expect(body.text).toBe("✓ Tarea registrada");
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal error",
    });

    await expect(sendWhatsAppMessage("+52123", "test")).rejects.toThrow(
      "WASenderApi send failed: 500"
    );
  });
});

describe("decryptMedia", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const sampleMediaData = {
    audioMessage: {
      mimetype: "audio/ogg; codecs=opus",
      mediaKey: "test-key-123",
      url: "https://mmg.whatsapp.net/encrypted",
    },
  };

  it("calls decrypt-media endpoint and downloads the decrypted file", async () => {
    // First call: POST /api/decrypt-media returns publicUrl
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ publicUrl: "https://temp.wasenderapi.com/decrypted/abc123.ogg" }),
    });

    // Second call: GET the public URL returns the actual file
    const testBuffer = new ArrayBuffer(10);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "audio/ogg" }),
      arrayBuffer: async () => testBuffer,
    });

    const result = await decryptMedia("msg-123", sampleMediaData);
    expect(result.contentType).toBe("audio/ogg");
    expect(result.buffer).toBeInstanceOf(Buffer);

    // Verify first call is POST to decrypt-media
    const [decryptUrl, decryptOptions] = mockFetch.mock.calls[0];
    expect(decryptUrl).toBe("https://www.wasenderapi.com/api/decrypt-media");
    expect(decryptOptions.method).toBe("POST");

    const body = JSON.parse(decryptOptions.body);
    expect(body.data.messages.key.id).toBe("msg-123");
    expect(body.data.messages.message).toEqual(sampleMediaData);

    // Verify second call fetches the public URL
    const [fileUrl] = mockFetch.mock.calls[1];
    expect(fileUrl).toBe("https://temp.wasenderapi.com/decrypted/abc123.ogg");
  });

  it("throws when decrypt-media returns an error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Invalid media data",
    });

    await expect(decryptMedia("msg-bad", sampleMediaData)).rejects.toThrow(
      "WASenderApi decrypt failed: 400"
    );
  });

  it("throws when decrypt-media returns no URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await expect(decryptMedia("msg-nourl", sampleMediaData)).rejects.toThrow(
      "WASenderApi decrypt returned no URL"
    );
  });

  it("throws when decrypted file download fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ publicUrl: "https://temp.wasenderapi.com/decrypted/gone.ogg" }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(decryptMedia("msg-gone", sampleMediaData)).rejects.toThrow(
      "Failed to download decrypted media: 404"
    );
  });
});
