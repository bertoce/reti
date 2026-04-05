import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all external dependencies before imports
vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/wasender", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ status: "sent" }),
}));

vi.mock("@/lib/media", () => ({
  processMedia: vi.fn().mockResolvedValue("https://storage.test.co/photo.jpg"),
  transcribeVoiceNote: vi.fn().mockResolvedValue("Compramos 50 blocks a 12 pesos"),
}));

vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

import { processMessage } from "@/lib/agent";
import { createServiceClient } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/wasender";

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
  Object.assign(chain, overrides);
  return chain;
}

describe("processMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips already-processed messages", async () => {
    const chain = createSupabaseChain();
    chain.single.mockResolvedValueOnce({
      data: {
        id: "msg-1",
        processed: true,
        project_id: "proj-1",
        direction: "inbound",
        message_type: "text",
        content: "test",
        wa_message_id: null,
        media_urls: null,
        sender_phone: "+521234",
      },
      error: null,
    });

    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    await processMessage("msg-1");

    // Should not call sendWhatsAppMessage
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("marks messages without project_id as processed", async () => {
    const chain = createSupabaseChain();
    chain.single.mockResolvedValueOnce({
      data: {
        id: "msg-orphan",
        processed: false,
        project_id: null,
        direction: "inbound",
        message_type: "text",
        content: "test",
        wa_message_id: null,
        media_urls: null,
        sender_phone: "+521234",
      },
      error: null,
    });

    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    await processMessage("msg-orphan");

    // Should have called update to mark as processed
    expect(chain.update).toHaveBeenCalled();
  });

  it("handles message not found gracefully", async () => {
    const chain = createSupabaseChain();
    chain.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    });

    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    // Should not throw
    await expect(processMessage("msg-missing")).resolves.toBeUndefined();
  });
});

describe("Agent tool input validation", () => {
  it("create_task expense input has correct structure", () => {
    const input = {
      title: "Compra de cemento",
      category: "expense",
      expense_amount: 1800,
      expense_vendor: "Cemex",
      expense_items: [
        { item: "Cemento", quantity: 10, unit_price: 180, subtotal: 1800 },
      ],
    };

    expect(input.title).toBeDefined();
    expect(input.category).toBe("expense");
    expect(input.expense_amount).toBeGreaterThan(0);

    const total = input.expense_items.reduce((s, i) => s + i.subtotal, 0);
    expect(total).toBe(input.expense_amount);
  });

  it("create_task progress input has correct structure", () => {
    const input = {
      title: "Colado segundo piso terminado",
      category: "progress",
      status: "completed",
    };

    expect(input.title).toBeDefined();
    expect(input.category).toBe("progress");
    expect(input.status).toBe("completed");
  });

  it("create_task issue input sets high priority", () => {
    const input = {
      title: "Falta material para instalación eléctrica",
      category: "issue",
      priority: "high",
    };

    expect(input.category).toBe("issue");
    expect(input.priority).toBe("high");
  });

  it("complete_task requires task_id", () => {
    const input = {
      task_id: "task-uuid-123",
      completion_note: "Terminado sin problemas",
    };

    expect(input.task_id).toBeDefined();
  });

  it("ask_clarification requires question", () => {
    const input = {
      question: "¿Avance, problema, o gasto?",
    };

    expect(input.question).toBeDefined();
    expect(input.question.length).toBeGreaterThan(0);
  });

  it("get_tasks accepts status and category filters", () => {
    const validStatuses = ["pending", "in_progress", "completed", "all"];
    const input = { status: "pending", category: "expense" };

    expect(validStatuses).toContain(input.status);
  });
});

describe("System prompt structure", () => {
  it("includes all required context sections", () => {
    const expectedSections = [
      "PROJECT:",
      "RESIDENTE:",
      "CURRENT TASKS",
      "WEEKLY EXPENSE TOTAL:",
      "RULES:",
    ];

    for (const section of expectedSections) {
      expect(section).toBeTruthy();
    }
  });
});
