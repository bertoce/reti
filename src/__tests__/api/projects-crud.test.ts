import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

function createChain() {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.insert = mockInsert.mockReturnValue(chain);
  chain.select = mockSelect.mockReturnValue(chain);
  chain.eq = mockEq.mockReturnValue(chain);
  chain.order = mockOrder.mockReturnValue(chain);
  chain.single = mockSingle;
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(() => createChain()),
}));

import { GET, POST } from "@/app/api/projects/route";

describe("GET /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no user_email or user_phone provided", async () => {
    const url = new URL("http://localhost:3000/api/projects");
    const res = await GET(new Request(url.toString()));
    expect(res.status).toBe(400);
  });

  it("returns projects for a developer email", async () => {
    mockOrder.mockReturnValueOnce({
      data: [{ id: "proj-1", name: "Casa Reforma" }],
      error: null,
    });

    const url = new URL("http://localhost:3000/api/projects");
    url.searchParams.set("user_email", "dev@test.com");
    const res = await GET(new Request(url.toString()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.projects).toHaveLength(1);
  });
});

describe("POST /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when name is missing", async () => {
    const req = new Request("http://localhost:3000/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates a project with required fields", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: "proj-new",
        name: "Casa Reforma",
        developer_email: "dev@test.com",
        residente_name: "Juan",
        residente_phone: "+521234",
      },
      error: null,
    });

    const req = new Request("http://localhost:3000/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Casa Reforma",
        developer_email: "dev@test.com",
        residente_name: "Juan",
        residente_phone: "+521234",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.project.name).toBe("Casa Reforma");
  });

  it("returns 400 when residente_phone is missing", async () => {
    const req = new Request("http://localhost:3000/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Casa Reforma",
        developer_email: "dev@test.com",
        residente_name: "Juan",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
