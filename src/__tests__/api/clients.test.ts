import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSingle = vi.fn();

function createChain() {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.single = mockSingle;
  return chain;
}

let chainResult: any = { data: [], error: null };
vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(() => {
    const chain = createChain();
    // For GET, the final call is .order() which should return data
    chain.order = vi.fn().mockReturnValue(chainResult);
    return chain;
  }),
}));

import { GET, POST } from "@/app/api/clients/route";

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost:3000/api/clients");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe("GET /api/clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chainResult = { data: [], error: null };
  });

  it("returns 400 when project_id is missing", async () => {
    const res = await GET(createRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns clients for a project", async () => {
    chainResult = {
      data: [
        { id: "c1", name: "Juan López", phone: "+5215551234567", unit: "Casa 3", opted_in: true },
      ],
      error: null,
    };

    const res = await GET(createRequest({ project_id: "proj-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.clients).toHaveLength(1);
    expect(json.clients[0].name).toBe("Juan López");
  });
});

describe("POST /api/clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when required fields are missing", async () => {
    const req = new Request("http://localhost:3000/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: "proj-1" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates a client with required fields", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "c-new", name: "María", phone: "+5215559876543", unit: null, opted_in: true },
      error: null,
    });

    const req = new Request("http://localhost:3000/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "proj-1",
        name: "María",
        phone: "+5215559876543",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.client.name).toBe("María");
  });
});
