import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(),
}));

import { GET } from "@/app/api/tasks/route";
import { createServiceClient } from "@/lib/supabase";

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost:3000/api/tasks");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

function createFullChain(returnData: any = []) {
  // Every method returns the chain so any order of calls works
  const chain: any = {};
  const self = () => chain;
  chain.from = vi.fn(self);
  chain.select = vi.fn(self);
  chain.eq = vi.fn(self);
  chain.order = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.gte = vi.fn(self);
  // Terminal: resolves the chain with data
  chain.then = (resolve: any) => resolve({ data: returnData, error: null });
  // Also support direct access for non-promise usage
  Object.defineProperty(chain, "data", { get: () => returnData });
  Object.defineProperty(chain, "error", { get: () => null });
  return chain;
}

describe("GET /api/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when project_id is missing", async () => {
    const res = await GET(createRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns tasks for a project", async () => {
    const tasks = [
      { id: "1", title: "Colado", status: "completed", category: "progress", expense_amount: null },
      { id: "2", title: "Cemento", status: "completed", category: "expense", expense_amount: 1800 },
    ];

    const chain = createFullChain(tasks);
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    const res = await GET(createRequest({ project_id: "proj-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.tasks).toBeDefined();
    expect(json.summary).toBeDefined();
  });

  it("passes status filter to query", async () => {
    const chain = createFullChain([]);
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    await GET(createRequest({ project_id: "proj-1", status: "pending" }));

    expect(chain.eq).toHaveBeenCalledWith("project_id", "proj-1");
    expect(chain.eq).toHaveBeenCalledWith("status", "pending");
  });

  it("passes category filter to query", async () => {
    const chain = createFullChain([]);
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    await GET(createRequest({ project_id: "proj-1", category: "expense" }));

    expect(chain.eq).toHaveBeenCalledWith("category", "expense");
  });

  it("does not filter when status=all", async () => {
    const chain = createFullChain([]);
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    await GET(createRequest({ project_id: "proj-1", status: "all" }));

    const eqCalls = chain.eq.mock.calls.map((c: any) => c[0]);
    expect(eqCalls).not.toContain("status");
  });
});
