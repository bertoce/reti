import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(),
}));

import { GET } from "@/app/api/photos/route";
import { createServiceClient } from "@/lib/supabase";

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost:3000/api/photos");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

function createFullChain(returnData: any = []) {
  const chain: any = {};
  const self = () => chain;
  chain.from = vi.fn(self);
  chain.select = vi.fn(self);
  chain.eq = vi.fn(self);
  chain.order = vi.fn(self);
  chain.then = (resolve: any) => resolve({ data: returnData, error: null });
  Object.defineProperty(chain, "data", { get: () => returnData });
  Object.defineProperty(chain, "error", { get: () => null });
  return chain;
}

describe("GET /api/photos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when project_id is missing", async () => {
    const res = await GET(createRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns photos for a project", async () => {
    const photos = [
      { id: "p1", file_url: "https://storage.test.co/photo1.jpg", category: "progress" },
      { id: "p2", file_url: "https://storage.test.co/photo2.jpg", category: "receipt" },
    ];

    const chain = createFullChain(photos);
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    const res = await GET(createRequest({ project_id: "proj-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.photos).toHaveLength(2);
    expect(json.photos[0].file_url).toContain("photo1.jpg");
  });

  it("filters photos by category", async () => {
    const chain = createFullChain([]);
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    await GET(createRequest({ project_id: "proj-1", category: "receipt" }));

    expect(chain.eq).toHaveBeenCalledWith("category", "receipt");
  });

  it("does not filter when category=all", async () => {
    const chain = createFullChain([]);
    vi.mocked(createServiceClient).mockReturnValue(chain as any);

    await GET(createRequest({ project_id: "proj-1", category: "all" }));

    const eqCalls = chain.eq.mock.calls.map((c: any) => c[0]);
    expect(eqCalls).not.toContain("category");
  });
});
