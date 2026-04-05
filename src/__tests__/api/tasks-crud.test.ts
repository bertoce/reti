import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

function createChain() {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.insert = mockInsert.mockReturnValue(chain);
  chain.update = mockUpdate.mockReturnValue(chain);
  chain.delete = mockDelete.mockReturnValue(chain);
  chain.select = mockSelect.mockReturnValue(chain);
  chain.eq = mockEq.mockReturnValue(chain);
  chain.single = mockSingle;
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(() => createChain()),
}));

import { POST } from "@/app/api/tasks/route";
import { PATCH, DELETE } from "@/app/api/tasks/[id]/route";

describe("POST /api/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when required fields are missing", async () => {
    const req = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: "proj-1" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates a task with required fields", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "task-new", title: "Nueva tarea", category: "progress", status: "pending" },
      error: null,
    });

    const req = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "proj-1",
        title: "Nueva tarea",
        category: "progress",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.task.title).toBe("Nueva tarea");
  });

  it("defaults priority to normal", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "task-new", priority: "normal" },
      error: null,
    });

    const req = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "proj-1",
        title: "Test",
        category: "general",
      }),
    });

    await POST(req);
    const insertedData = mockInsert.mock.calls[0][0];
    expect(insertedData.priority).toBe("normal");
  });
});

describe("PATCH /api/tasks/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no valid fields provided", async () => {
    const req = new Request("http://localhost:3000/api/tasks/task-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalid_field: "value" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "task-1" }) });
    expect(res.status).toBe(400);
  });

  it("updates a task title", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "task-1", title: "Título actualizado" },
      error: null,
    });

    const req = new Request("http://localhost:3000/api/tasks/task-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Título actualizado" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "task-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.task.title).toBe("Título actualizado");
  });

  it("sets completed_at when status changes to completed", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "task-1", status: "completed", completed_at: "2026-04-05T00:00:00Z" },
      error: null,
    });

    const req = new Request("http://localhost:3000/api/tasks/task-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });

    await PATCH(req, { params: Promise.resolve({ id: "task-1" }) });

    const updates = mockUpdate.mock.calls[0][0];
    expect(updates.completed_at).toBeDefined();
    expect(updates.status).toBe("completed");
  });
});

describe("DELETE /api/tasks/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a task", async () => {
    mockEq.mockReturnValueOnce({ error: null });

    const req = new Request("http://localhost:3000/api/tasks/task-1", {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: "task-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
  });
});
