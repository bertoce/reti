import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(),
}));

import { GET } from "@/app/api/project/route";
import { createServiceClient } from "@/lib/supabase";

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost:3000/api/project");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe("GET /api/project", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when id is missing", async () => {
    const res = await GET(createRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 when project not found", async () => {
    const chain: any = {};
    chain.from = vi.fn().mockReturnValue(chain);
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } });
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.gte = vi.fn().mockReturnValue(chain);

    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    const res = await GET(createRequest({ id: "nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("returns project with summary stats", async () => {
    const project = {
      id: "proj-1",
      name: "Casa Patios",
      developer_name: "Reurbano",
      residente_name: "Juan",
      residente_phone: "+5212345678",
      status: "active",
    };

    const tasks = [
      { status: "completed", category: "progress", expense_amount: null, created_at: "2026-04-01T10:00:00Z" },
      { status: "completed", category: "expense", expense_amount: 1800, created_at: "2026-04-03T10:00:00Z" },
      { status: "pending", category: "issue", expense_amount: null, created_at: "2026-04-04T10:00:00Z" },
      { status: "pending", category: "material", expense_amount: null, created_at: "2026-04-04T10:00:00Z" },
    ];

    let callCount = 0;
    const chain: any = {};
    chain.from = vi.fn().mockReturnValue(chain);
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.gte = vi.fn().mockReturnValue(chain);

    chain.single = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Project query
        return Promise.resolve({ data: project, error: null });
      } else {
        // Last message query
        return Promise.resolve({ data: { created_at: "2026-04-04T10:00:00Z" }, error: null });
      }
    });

    // Tasks query (not chained to .single())
    // Override the select to return tasks when querying site_tasks
    const origFrom = chain.from;
    chain.from = vi.fn().mockImplementation((table: string) => {
      if (table === "site_tasks") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ data: tasks, error: null }),
          }),
        };
      }
      return chain;
    });

    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    const res = await GET(createRequest({ id: "proj-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.project.name).toBe("Casa Patios");
    expect(json.summary).toBeDefined();
    expect(json.last_activity).toBeDefined();
  });
});
