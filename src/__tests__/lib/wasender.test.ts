import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  sendWhatsAppMessage,
  downloadMedia,
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
  it("parses a text message correctly", () => {
    const payload = {
      message: {
        key: {
          remoteJid: "5212345678@s.whatsapp.net",
          fromMe: false,
          id: "msg-123",
        },
        message: {
          conversation: "Hoy terminamos el colado",
        },
      },
    };

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.from).toBe("5212345678");
    expect(result!.type).toBe("text");
    expect(result!.text).toBe("Hoy terminamos el colado");
    expect(result!.hasMedia).toBe(false);
    expect(result!.messageId).toBe("msg-123");
  });

  it("parses an extended text message", () => {
    const payload = {
      message: {
        key: {
          remoteJid: "5212345678@s.whatsapp.net",
          fromMe: false,
          id: "msg-456",
        },
        message: {
          extendedTextMessage: {
            text: "Falta material para la instalación",
          },
        },
      },
    };

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("text");
    expect(result!.text).toBe("Falta material para la instalación");
  });

  it("parses an image message with caption", () => {
    const payload = {
      message: {
        key: {
          remoteJid: "5212345678@s.whatsapp.net",
          fromMe: false,
          id: "msg-789",
        },
        message: {
          imageMessage: {
            caption: "Avance del segundo piso",
            mimetype: "image/jpeg",
          },
        },
      },
    };

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("image");
    expect(result!.caption).toBe("Avance del segundo piso");
    expect(result!.hasMedia).toBe(true);
  });

  it("parses an image message without caption", () => {
    const payload = {
      message: {
        key: {
          remoteJid: "5212345678@s.whatsapp.net",
          fromMe: false,
          id: "msg-101",
        },
        message: {
          imageMessage: {
            mimetype: "image/jpeg",
          },
        },
      },
    };

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("image");
    expect(result!.caption).toBeUndefined();
    expect(result!.hasMedia).toBe(true);
  });

  it("parses a voice message", () => {
    const payload = {
      message: {
        key: {
          remoteJid: "5212345678@s.whatsapp.net",
          fromMe: false,
          id: "msg-voice",
        },
        message: {
          audioMessage: {
            mimetype: "audio/ogg; codecs=opus",
            ptt: true,
          },
        },
      },
    };

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("voice");
    expect(result!.hasMedia).toBe(true);
  });

  it("parses a document message", () => {
    const payload = {
      message: {
        key: {
          remoteJid: "5212345678@s.whatsapp.net",
          fromMe: false,
          id: "msg-doc",
        },
        message: {
          documentMessage: {
            caption: "Factura del proveedor",
            mimetype: "application/pdf",
          },
        },
      },
    };

    const result = parseWebhookPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("document");
    expect(result!.caption).toBe("Factura del proveedor");
    expect(result!.hasMedia).toBe(true);
  });

  it("skips outgoing messages (fromMe=true)", () => {
    const payload = {
      message: {
        key: {
          remoteJid: "5212345678@s.whatsapp.net",
          fromMe: true,
          id: "msg-out",
        },
        message: {
          conversation: "Agent reply",
        },
      },
    };

    const result = parseWebhookPayload(payload);
    expect(result).toBeNull();
  });

  it("returns null for empty payload", () => {
    expect(parseWebhookPayload({})).toBeNull();
  });

  it("returns null for payload without message key", () => {
    expect(parseWebhookPayload({ message: {} })).toBeNull();
  });

  it("returns null for unrecognized message type", () => {
    const payload = {
      message: {
        key: {
          remoteJid: "5212345678@s.whatsapp.net",
          fromMe: false,
          id: "msg-unknown",
        },
        message: {
          stickerMessage: { mimetype: "image/webp" },
        },
      },
    };

    const result = parseWebhookPayload(payload);
    expect(result).toBeNull();
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
    expect(url).toContain("/send-message/test-session-id");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.to).toBe("+5212345678");
    expect(body.type).toBe("text");
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

describe("downloadMedia", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("downloads media and returns buffer + content type", async () => {
    const testBuffer = new ArrayBuffer(10);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: async () => testBuffer,
    });

    const result = await downloadMedia("msg-123");
    expect(result.contentType).toBe("image/jpeg");
    expect(result.buffer).toBeInstanceOf(Buffer);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/download-media/test-session-id/msg-123");
  });

  it("throws on download failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Not found",
    });

    await expect(downloadMedia("msg-404")).rejects.toThrow(
      "WASenderApi download failed: 404"
    );
  });
});
