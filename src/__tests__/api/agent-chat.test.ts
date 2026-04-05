import { describe, it, expect, vi, beforeEach } from "vitest";

const mockChatWithAgent = vi.fn().mockResolvedValue("Respuesta del agente");
vi.mock("@/lib/agent", () => ({
  chatWithAgent: (...args: unknown[]) => mockChatWithAgent(...args),
}));

import { POST } from "@/app/api/agent/chat/route";

function createRequest(body: object) {
  return new Request("http://localhost:3000/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/agent/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when project_id is missing", async () => {
    const res = await POST(createRequest({ message: "Hola" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when message is missing", async () => {
    const res = await POST(createRequest({ project_id: "proj-1" }));
    expect(res.status).toBe(400);
  });

  it("returns agent reply for valid request", async () => {
    const res = await POST(createRequest({
      project_id: "proj-1",
      message: "¿Qué tareas están pendientes?",
    }));

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.reply).toBe("Respuesta del agente");
    expect(mockChatWithAgent).toHaveBeenCalledWith("proj-1", "¿Qué tareas están pendientes?", undefined);
  });

  it("passes task_context when provided", async () => {
    const taskContext = {
      id: "task-1",
      title: "Colado",
      status: "pending",
      category: "progress",
    };

    await POST(createRequest({
      project_id: "proj-1",
      message: "¿Cuándo se termina?",
      task_context: taskContext,
    }));

    expect(mockChatWithAgent).toHaveBeenCalledWith(
      "proj-1",
      "¿Cuándo se termina?",
      taskContext
    );
  });

  it("returns 500 when agent fails", async () => {
    mockChatWithAgent.mockRejectedValueOnce(new Error("Claude down"));

    const res = await POST(createRequest({
      project_id: "proj-1",
      message: "test",
    }));

    expect(res.status).toBe(500);
  });
});
