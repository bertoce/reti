import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before imports
vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/wasender", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ status: "sent" }),
}));

vi.mock("@/lib/media", () => ({
  processMedia: vi.fn().mockResolvedValue("https://storage.test.co/photo.jpg"),
  transcribeVoiceNote: vi.fn().mockResolvedValue("Transcripción de prueba"),
}));

vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

import { buildConversationHistory } from "@/lib/agent";
import { createServiceClient } from "@/lib/supabase";

function createSupabaseChain(overrides: Record<string, any> = {}) {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lt = vi.fn().mockReturnValue(chain);
  Object.assign(chain, overrides);
  return chain;
}

describe("buildConversationHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no messages exist", async () => {
    const chain = createSupabaseChain();
    chain.limit = vi.fn().mockReturnValue({ data: [], error: null });
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    const result = await buildConversationHistory("proj-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when all messages have null content", async () => {
    const chain = createSupabaseChain();
    chain.limit = vi.fn().mockReturnValue({
      data: [
        { id: "m1", direction: "inbound", content: null, message_type: "image", created_at: "2026-04-04T10:00:00Z" },
      ],
      error: null,
    });
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    const result = await buildConversationHistory("proj-1");
    expect(result).toEqual([]);
  });

  it("converts inbound messages to user role", async () => {
    const chain = createSupabaseChain();
    chain.limit = vi.fn().mockReturnValue({
      data: [
        { id: "m1", direction: "inbound", content: "Hola", message_type: "text", created_at: "2026-04-04T10:00:00Z" },
        { id: "m2", direction: "outbound", content: "✓ Recibido", message_type: "text", created_at: "2026-04-04T10:00:05Z" },
      ],
      error: null,
    });
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    const result = await buildConversationHistory("proj-1");
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe("user");
    expect(result[1].role).toBe("assistant");
  });

  it("merges consecutive same-role messages", async () => {
    const chain = createSupabaseChain();
    chain.limit = vi.fn().mockReturnValue({
      data: [
        { id: "m1", direction: "inbound", content: "Terminamos", message_type: "text", created_at: "2026-04-04T10:00:00Z" },
        { id: "m2", direction: "inbound", content: "el colado", message_type: "text", created_at: "2026-04-04T10:00:01Z" },
        { id: "m3", direction: "outbound", content: "✓ Ok", message_type: "text", created_at: "2026-04-04T10:00:05Z" },
      ],
      error: null,
    });
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    const result = await buildConversationHistory("proj-1");
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe("user");
    expect(result[0].content).toContain("Terminamos");
    expect(result[0].content).toContain("el colado");
  });

  it("excludes the current message by ID", async () => {
    const chain = createSupabaseChain();
    chain.limit = vi.fn().mockReturnValue({
      data: [
        { id: "m1", direction: "inbound", content: "Old", message_type: "text", created_at: "2026-04-04T10:00:00Z" },
        { id: "m2", direction: "outbound", content: "Reply", message_type: "text", created_at: "2026-04-04T10:00:05Z" },
        { id: "current", direction: "inbound", content: "Current", message_type: "text", created_at: "2026-04-04T10:01:00Z" },
      ],
      error: null,
    });
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    const result = await buildConversationHistory("proj-1", "current");
    expect(result).toHaveLength(2);
    // "Current" message should be excluded
    const allContent = result.map((m) => m.content as string).join(" ");
    expect(allContent).not.toContain("Current");
  });

  it("prefixes voice note messages", async () => {
    const chain = createSupabaseChain();
    chain.limit = vi.fn().mockReturnValue({
      data: [
        { id: "m1", direction: "inbound", content: "Terminamos el trabajo", message_type: "voice", created_at: "2026-04-04T10:00:00Z" },
        { id: "m2", direction: "outbound", content: "✓ Ok", message_type: "text", created_at: "2026-04-04T10:00:05Z" },
      ],
      error: null,
    });
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    const result = await buildConversationHistory("proj-1");
    expect(result[0].content).toContain("[Nota de voz]");
  });

  it("ensures history starts with user role", async () => {
    const chain = createSupabaseChain();
    chain.limit = vi.fn().mockReturnValue({
      data: [
        { id: "m1", direction: "outbound", content: "Agent first", message_type: "text", created_at: "2026-04-04T10:00:00Z" },
        { id: "m2", direction: "inbound", content: "User reply", message_type: "text", created_at: "2026-04-04T10:00:05Z" },
      ],
      error: null,
    });
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    const result = await buildConversationHistory("proj-1");
    // Should start with user, so the outbound-first message is dropped
    expect(result[0].role).toBe("user");
  });
});
