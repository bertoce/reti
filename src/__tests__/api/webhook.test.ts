import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

function createChain() {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.insert = mockInsert.mockReturnValue(chain);
  chain.select = mockSelect.mockReturnValue(chain);
  chain.eq = mockEq.mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.limit = mockLimit.mockReturnValue(chain);
  chain.single = mockSingle;
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(() => createChain()),
}));

vi.mock("@/lib/wasender", () => ({
  verifyWebhookSignature: vi.fn().mockReturnValue(true),
  parseWebhookPayload: vi.fn(),
}));

// Mock the agent's processMessage
const mockProcessMessage = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/agent", () => ({
  processMessage: (...args: unknown[]) => mockProcessMessage(...args),
}));

import { POST } from "@/app/api/webhooks/whatsapp/route";
import { verifyWebhookSignature, parseWebhookPayload } from "@/lib/wasender";

function createRequest(body: object, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/webhooks/whatsapp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/webhooks/whatsapp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 for non-message webhooks (status updates, etc.)", async () => {
    vi.mocked(parseWebhookPayload).mockReturnValueOnce(null);

    const res = await POST(createRequest({ event: "status_update" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
  });

  it("returns 401 when signature verification fails", async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValueOnce(false);

    const res = await POST(createRequest({ test: true }));

    expect(res.status).toBe(401);
  });

  it("stores an incoming text message and processes it with agent", async () => {
    vi.mocked(parseWebhookPayload).mockReturnValueOnce({
      messageId: "wa-msg-123",
      from: "+5212345678",
      type: "text",
      text: "Terminamos el colado",
      hasMedia: false,
    });

    // No duplicate found
    mockLimit.mockReturnValueOnce({ data: [], error: null });

    // Project found
    mockSingle.mockResolvedValueOnce({
      data: { id: "proj-1" },
      error: null,
    });

    // Message inserted
    mockSingle.mockResolvedValueOnce({
      data: { id: "msg-new-1" },
      error: null,
    });

    const res = await POST(createRequest({
      event: "messages.received",
      data: {
        messages: {
          key: { cleanedSenderPn: "5212345678", fromMe: false, id: "wa-msg-123" },
          message: { conversation: "Terminamos el colado" },
        },
      },
    }));

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.message_id).toBe("msg-new-1");

    // Verify the agent processed the message inline
    expect(mockProcessMessage).toHaveBeenCalledWith("msg-new-1");
  });

  it("deduplicates messages by wa_message_id", async () => {
    vi.mocked(parseWebhookPayload).mockReturnValueOnce({
      messageId: "wa-msg-dup",
      from: "+5212345678",
      type: "text",
      text: "Duplicado",
      hasMedia: false,
    });

    // Duplicate found
    mockLimit.mockReturnValueOnce({ data: [{ id: "existing-msg" }], error: null });

    const res = await POST(createRequest({
      event: "messages.received",
      data: {
        messages: {
          key: { cleanedSenderPn: "5212345678", fromMe: false, id: "wa-msg-dup" },
          message: { conversation: "Duplicado" },
        },
      },
    }));

    const json = await res.json();
    expect(json.ok).toBe(true);

    // Should NOT have inserted a new message
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("stores message even when no project found for phone number", async () => {
    vi.mocked(parseWebhookPayload).mockReturnValueOnce({
      messageId: "wa-msg-orphan",
      from: "+9999999999",
      type: "text",
      text: "Unknown number",
      hasMedia: false,
    });

    // No duplicate
    mockLimit.mockReturnValueOnce({ data: [], error: null });

    // No project found
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "No rows" },
    });

    // Message inserted (with null project_id)
    mockSingle.mockResolvedValueOnce({
      data: { id: "msg-orphan" },
      error: null,
    });

    const res = await POST(createRequest({
      event: "messages.received",
      data: {
        messages: {
          key: { cleanedSenderPn: "9999999999", fromMe: false, id: "wa-msg-orphan" },
          message: { conversation: "Unknown number" },
        },
      },
    }));

    expect(res.status).toBe(200);
  });

  it("stores mediaData for voice messages", async () => {
    const mediaData = {
      audioMessage: {
        mimetype: "audio/ogg; codecs=opus",
        mediaKey: "voice-key-123",
        url: "https://mmg.whatsapp.net/encrypted-audio",
      },
    };

    vi.mocked(parseWebhookPayload).mockReturnValueOnce({
      messageId: "wa-msg-voice",
      from: "+5212345678",
      type: "voice",
      hasMedia: true,
      mediaData,
    });

    // No duplicate
    mockLimit.mockReturnValueOnce({ data: [], error: null });

    // Project found
    mockSingle.mockResolvedValueOnce({
      data: { id: "proj-1" },
      error: null,
    });

    // Message inserted
    mockSingle.mockResolvedValueOnce({
      data: { id: "msg-voice-1" },
      error: null,
    });

    const res = await POST(createRequest({
      event: "messages.received",
      data: {
        messages: {
          key: { cleanedSenderPn: "5212345678", fromMe: false, id: "wa-msg-voice" },
          message: { audioMessage: mediaData.audioMessage },
        },
      },
    }));

    expect(res.status).toBe(200);

    // Verify media_data was included in the insert
    const insertedData = mockInsert.mock.calls[0][0];
    expect(insertedData.media_data).toEqual(mediaData);
    expect(insertedData.message_type).toBe("voice");
  });

  it("still returns 200 if agent processing fails", async () => {
    vi.mocked(parseWebhookPayload).mockReturnValueOnce({
      messageId: "wa-msg-fail",
      from: "+5212345678",
      type: "text",
      text: "Agent will fail",
      hasMedia: false,
    });

    // No duplicate
    mockLimit.mockReturnValueOnce({ data: [], error: null });

    // Project found
    mockSingle.mockResolvedValueOnce({
      data: { id: "proj-1" },
      error: null,
    });

    // Message inserted
    mockSingle.mockResolvedValueOnce({
      data: { id: "msg-fail-1" },
      error: null,
    });

    // Agent throws
    mockProcessMessage.mockRejectedValueOnce(new Error("Claude API down"));

    const res = await POST(createRequest({
      event: "messages.received",
      data: {
        messages: {
          key: { cleanedSenderPn: "5212345678", fromMe: false, id: "wa-msg-fail" },
          message: { conversation: "Agent will fail" },
        },
      },
    }));

    expect(res.status).toBe(200);
    expect(mockProcessMessage).toHaveBeenCalledWith("msg-fail-1");
  });
});
