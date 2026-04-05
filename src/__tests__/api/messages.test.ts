import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(),
}));

import { GET } from "@/app/api/messages/route";
import { createServiceClient } from "@/lib/supabase";

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost:3000/api/messages");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe("GET /api/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when project_id is missing", async () => {
    const res = await GET(createRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns messages in chronological order", async () => {
    const messages = [
      { id: "m1", direction: "inbound", content: "Hola", created_at: "2026-04-01T10:00:00Z" },
      { id: "m2", direction: "outbound", content: "✓ Recibido", created_at: "2026-04-01T10:00:05Z" },
    ];

    const chain: any = {};
    chain.from = vi.fn().mockReturnValue(chain);
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue({ data: messages, error: null });

    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    const res = await GET(createRequest({ project_id: "proj-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.messages).toHaveLength(2);

    // Verify ascending order was requested
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: true });
  });

  it("respects custom limit parameter", async () => {
    const chain: any = {};
    chain.from = vi.fn().mockReturnValue(chain);
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue({ data: [], error: null });

    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    await GET(createRequest({ project_id: "proj-1", limit: "10" }));

    expect(chain.limit).toHaveBeenCalledWith(10);
  });

  it("defaults to 50 messages when no limit specified", async () => {
    const chain: any = {};
    chain.from = vi.fn().mockReturnValue(chain);
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue({ data: [], error: null });

    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    await GET(createRequest({ project_id: "proj-1" }));

    expect(chain.limit).toHaveBeenCalledWith(50);
  });
});
