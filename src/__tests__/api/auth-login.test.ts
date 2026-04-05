import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase auth
const mockSignInWithOtp = vi.fn();
vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(() => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
    },
  })),
}));

import { POST } from "@/app/api/auth/login/route";

function createRequest(body: object) {
  return new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
  });

  it("sends OTP magic link for valid email", async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ data: {}, error: null });

    const res = await POST(createRequest({ email: "dev@test.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: "dev@test.com",
      options: { emailRedirectTo: expect.stringContaining("/auth/callback") },
    });
  });

  it("returns 500 when Supabase returns an error", async () => {
    mockSignInWithOtp.mockResolvedValueOnce({
      data: null,
      error: { message: "Rate limit exceeded" },
    });

    const res = await POST(createRequest({ email: "dev@test.com" }));
    expect(res.status).toBe(500);
  });
});
