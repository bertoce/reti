import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @supabase/supabase-js before importing
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    storage: { from: vi.fn() },
  })),
}));

import { createServiceClient } from "@/lib/supabase";
import type { Project, SiteTask, SiteMessage, SitePhoto, ExpenseItem } from "@/lib/supabase";

describe("createServiceClient", () => {
  it("creates a supabase client with env vars", () => {
    const client = createServiceClient();
    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
    expect(client.storage).toBeDefined();
  });

  it("throws if SUPABASE_URL is missing", () => {
    const original = process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    expect(() => createServiceClient()).toThrow("Missing NEXT_PUBLIC_SUPABASE_URL");

    process.env.NEXT_PUBLIC_SUPABASE_URL = original;
  });

  it("throws if SERVICE_ROLE_KEY is missing", () => {
    const original = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => createServiceClient()).toThrow("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

    process.env.SUPABASE_SERVICE_ROLE_KEY = original;
  });
});

describe("Type definitions", () => {
  it("Project type has correct shape", () => {
    const project: Project = {
      id: "test-uuid",
      name: "Test Project",
      developer_name: "Dev Co",
      developer_phone: "+1234567890",
      developer_email: "dev@test.com",
      residente_name: "Juan",
      residente_phone: "+0987654321",
      status: "active",
      created_at: new Date().toISOString(),
    };
    expect(project.status).toBe("active");
    expect(project.name).toBe("Test Project");
  });

  it("SiteTask type supports expense fields", () => {
    const task: SiteTask = {
      id: "task-uuid",
      project_id: "project-uuid",
      title: "Compra de cemento",
      description: "10 bultos",
      category: "expense",
      status: "completed",
      priority: "normal",
      expense_amount: 1800,
      expense_currency: "MXN",
      expense_vendor: "Cemex",
      expense_items: [
        { item: "Cemento", quantity: 10, unit_price: 180, subtotal: 1800 },
      ],
      receipt_url: "https://storage.example.com/receipt.jpg",
      photos: null,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(task.category).toBe("expense");
    expect(task.expense_amount).toBe(1800);
    expect(task.expense_items).toHaveLength(1);
  });

  it("SiteTask type supports non-expense tasks", () => {
    const task: SiteTask = {
      id: "task-uuid",
      project_id: "project-uuid",
      title: "Colado segundo piso",
      description: null,
      category: "progress",
      status: "completed",
      priority: "normal",
      expense_amount: null,
      expense_currency: "MXN",
      expense_vendor: null,
      expense_items: null,
      receipt_url: null,
      photos: ["https://storage.example.com/photo1.jpg"],
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(task.category).toBe("progress");
    expect(task.expense_amount).toBeNull();
    expect(task.photos).toHaveLength(1);
  });

  it("ExpenseItem type validates fields", () => {
    const item: ExpenseItem = {
      item: "Block",
      quantity: 50,
      unit_price: 12,
      subtotal: 600,
    };
    expect(item.quantity * item.unit_price).toBe(item.subtotal);
  });

  it("SiteMessage type captures agent metadata", () => {
    const msg: SiteMessage = {
      id: "msg-uuid",
      project_id: "project-uuid",
      direction: "inbound",
      message_type: "text",
      content: "Terminamos la instalación eléctrica",
      media_urls: null,
      agent_intent: "report_progress",
      agent_actions: [{ tool: "create_task", params: {}, result: {} }],
      task_id: "task-uuid",
      wa_message_id: "wa-123",
      sender_phone: "+5212345678",
      processed: true,
      created_at: new Date().toISOString(),
    };
    expect(msg.direction).toBe("inbound");
    expect(msg.processed).toBe(true);
  });
});
