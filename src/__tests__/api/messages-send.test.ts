import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSendWhatsApp = vi.fn().mockResolvedValue({ status: "sent" });
vi.mock("@/lib/wasender", () => ({
  sendWhatsAppMessage: (...args: unknown[]) => mockSendWhatsApp(...args),
}));

const mockInsert = vi.fn();
let clientsResult: any = { data: [], error: null };

vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(() => {
    const chain: any = {};
    chain.from = vi.fn().mockReturnValue(chain);
    chain.select = vi.fn().mockReturnValue(chain);
    chain.insert = mockInsert.mockReturnValue(chain);
    chain.in = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(clientsResult);
    return chain;
  }),
}));

import { POST } from "@/app/api/messages/send/route";

function createRequest(body: object) {
  return new Request("http://localhost:3000/api/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/messages/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientsResult = { data: [], error: null };
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(createRequest({ project_id: "proj-1" }));
    expect(res.status).toBe(400);
  });

  it("sends messages to opted-in clients", async () => {
    clientsResult = {
      data: [
        { id: "c1", name: "Juan", phone: "+5215551111", opted_in: true },
        { id: "c2", name: "María", phone: "+5215552222", opted_in: true },
      ],
      error: null,
    };

    const res = await POST(createRequest({
      project_id: "proj-1",
      client_ids: ["c1", "c2"],
      message: "¡Avance de la semana!",
    }));

    const json = await res.json();
    expect(json.sent).toBe(2);
    expect(json.failed).toBe(0);
    expect(mockSendWhatsApp).toHaveBeenCalledTimes(2);
  });

  it("skips opted-out clients", async () => {
    clientsResult = {
      data: [
        { id: "c1", name: "Juan", phone: "+5215551111", opted_in: true },
        { id: "c2", name: "María", phone: "+5215552222", opted_in: false },
      ],
      error: null,
    };

    const res = await POST(createRequest({
      project_id: "proj-1",
      client_ids: ["c1", "c2"],
      message: "Update",
    }));

    const json = await res.json();
    expect(json.sent).toBe(1);
    expect(mockSendWhatsApp).toHaveBeenCalledTimes(1);
    expect(mockSendWhatsApp).toHaveBeenCalledWith("+5215551111", "Update");
  });

  it("reports failures when send fails", async () => {
    clientsResult = {
      data: [
        { id: "c1", name: "Juan", phone: "+5215551111", opted_in: true },
      ],
      error: null,
    };

    mockSendWhatsApp.mockRejectedValueOnce(new Error("Rate limited"));

    const res = await POST(createRequest({
      project_id: "proj-1",
      client_ids: ["c1"],
      message: "Test",
    }));

    const json = await res.json();
    expect(json.sent).toBe(0);
    expect(json.failed).toBe(1);
  });

  it("logs outbound_client messages to site_messages", async () => {
    clientsResult = {
      data: [
        { id: "c1", name: "Juan", phone: "+5215551111", opted_in: true },
      ],
      error: null,
    };

    await POST(createRequest({
      project_id: "proj-1",
      client_ids: ["c1"],
      message: "Avance",
    }));

    // Verify insert was called for the outbound_client message
    expect(mockInsert).toHaveBeenCalled();
    const insertedData = mockInsert.mock.calls.find(
      (call: any[]) => call[0]?.direction === "outbound_client"
    );
    expect(insertedData).toBeDefined();
  });
});
