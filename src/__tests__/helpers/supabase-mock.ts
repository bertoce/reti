// Shared test helper for Supabase chain mocking
import { vi } from "vitest";
import type { SiteTask, SiteMessage, Client } from "@/lib/supabase";

/**
 * Creates a mock Supabase chain where all methods return `this`
 * and the terminal method returns the provided data.
 */
export function createSupabaseChain(overrides: Record<string, any> = {}) {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lt = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  Object.assign(chain, overrides);
  return chain;
}

/**
 * Creates a GET Request with query parameters.
 */
export function createGetRequest(
  path: string,
  params: Record<string, string> = {}
) {
  const url = new URL(`http://localhost:3000${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

/**
 * Creates a POST/PATCH/DELETE Request with JSON body.
 */
export function createJsonRequest(
  path: string,
  body: object,
  method: string = "POST"
) {
  return new Request(`http://localhost:3000${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Factory for SiteTask test data.
 */
export function makeTask(overrides: Partial<SiteTask> = {}): SiteTask {
  return {
    id: "task-" + Math.random().toString(36).slice(2),
    project_id: "proj-1",
    title: "Test task",
    description: null,
    category: "progress",
    status: "pending",
    priority: "normal",
    expense_amount: null,
    expense_currency: "MXN",
    expense_vendor: null,
    expense_items: null,
    receipt_url: null,
    photos: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Factory for SiteMessage test data.
 */
export function makeMessage(overrides: Partial<SiteMessage> = {}): SiteMessage {
  return {
    id: "msg-" + Math.random().toString(36).slice(2),
    project_id: "proj-1",
    direction: "inbound",
    message_type: "text",
    content: "Test message",
    media_urls: null,
    agent_intent: null,
    agent_actions: null,
    task_id: null,
    wa_message_id: null,
    sender_phone: "+5212345678",
    processed: true,
    album_id: null,
    album_expected_count: null,
    created_at: "2026-04-04T10:00:00Z",
    ...overrides,
  };
}

/**
 * Factory for Client test data.
 */
export function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "client-" + Math.random().toString(36).slice(2),
    project_id: "proj-1",
    name: "Test Client",
    phone: "+5215551234567",
    unit: null,
    opted_in: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
