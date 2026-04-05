import { describe, it, expect, vi, beforeEach } from "vitest";

const mockProcessMessage = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/agent", () => ({
  processMessage: (...args: unknown[]) => mockProcessMessage(...args),
}));

// Build a mock that tracks which table and what operation is being called
let staleMessagesResult: any = { data: [], error: null };
let albumCheckResult: any = { data: [], error: null };

function createMockSupabase() {
  const makeChain = (terminal: any) => {
    const chain: any = {};
    chain.from = vi.fn().mockImplementation(() => chain);
    chain.select = vi.fn().mockImplementation(() => chain);
    chain.eq = vi.fn().mockImplementation(() => chain);
    chain.lt = vi.fn().mockImplementation(() => chain);
    chain.order = vi.fn().mockImplementation(() => chain);
    chain.limit = vi.fn().mockImplementation(() => staleMessagesResult);
    // For queries that don't end with .limit() (like album check),
    // we chain through and the final .eq() call returns albumCheckResult
    return chain;
  };

  let callCount = 0;
  const supabase: any = {
    from: vi.fn().mockImplementation((table: string) => {
      callCount++;
      const chain: any = {};
      chain.select = vi.fn().mockImplementation(() => chain);
      chain.eq = vi.fn().mockImplementation(() => {
        // If this is the second from() call, it's the album check
        if (callCount >= 2) return albumCheckResult;
        return chain;
      });
      chain.lt = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockImplementation(() => staleMessagesResult);
      return chain;
    }),
  };
  return supabase;
}

vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(() => createMockSupabase()),
}));

import { GET } from "@/app/api/cron/retry/route";

describe("GET /api/cron/retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    staleMessagesResult = { data: [], error: null };
    albumCheckResult = { data: [], error: null };
  });

  it("returns 0 retried when no stale messages", async () => {
    staleMessagesResult = { data: [], error: null };

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.retried).toBe(0);
  });

  it("reprocesses stale non-album messages", async () => {
    staleMessagesResult = {
      data: [
        { id: "msg-stale-1", album_id: null, album_expected_count: null },
        { id: "msg-stale-2", album_id: null, album_expected_count: null },
      ],
      error: null,
    };

    const res = await GET();
    const json = await res.json();

    expect(json.retried).toBe(2);
    expect(mockProcessMessage).toHaveBeenCalledTimes(2);
    expect(mockProcessMessage).toHaveBeenCalledWith("msg-stale-1");
    expect(mockProcessMessage).toHaveBeenCalledWith("msg-stale-2");
  });

  it("continues processing when one message fails", async () => {
    staleMessagesResult = {
      data: [
        { id: "msg-fail", album_id: null, album_expected_count: null },
        { id: "msg-ok", album_id: null, album_expected_count: null },
      ],
      error: null,
    };

    mockProcessMessage
      .mockRejectedValueOnce(new Error("Claude API down"))
      .mockResolvedValueOnce(undefined);

    const res = await GET();
    const json = await res.json();

    expect(json.retried).toBe(1);
    expect(mockProcessMessage).toHaveBeenCalledTimes(2);
  });
});
