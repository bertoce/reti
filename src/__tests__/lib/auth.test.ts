import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @supabase/ssr
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
  createBrowserClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

describe("createAuthClient (browser)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a browser client with public env vars", async () => {
    const { createBrowserClient } = await import("@supabase/ssr");
    const { createAuthClient } = await import("@/lib/auth");

    createAuthClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      expect.any(String)
    );
  });
});

describe("getUserRole", () => {
  it("returns 'developer' when user email matches project developer_email", async () => {
    const { getUserRole } = await import("@/lib/auth");

    const role = getUserRole(
      { email: "dev@test.com", phone: null },
      { developer_email: "dev@test.com", residente_phone: "+521234" }
    );

    expect(role).toBe("developer");
  });

  it("returns 'residente' when user phone matches project residente_phone", async () => {
    const { getUserRole } = await import("@/lib/auth");

    const role = getUserRole(
      { email: null, phone: "+521234" },
      { developer_email: "dev@test.com", residente_phone: "+521234" }
    );

    expect(role).toBe("residente");
  });

  it("returns null when user matches neither", async () => {
    const { getUserRole } = await import("@/lib/auth");

    const role = getUserRole(
      { email: "random@test.com", phone: "+999999" },
      { developer_email: "dev@test.com", residente_phone: "+521234" }
    );

    expect(role).toBeNull();
  });
});
