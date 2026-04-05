import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// We need to mock next/navigation for the login component
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

import LoginForm from "@/components/LoginForm";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email input and submit button", () => {
    render(<LoginForm />);
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit")).toBeInTheDocument();
  });

  it("submit is disabled when email is empty", () => {
    render(<LoginForm />);
    expect(screen.getByTestId("login-submit")).toBeDisabled();
  });

  it("enables submit when email is entered", () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "dev@test.com" },
    });
    expect(screen.getByTestId("login-submit")).not.toBeDisabled();
  });

  it("calls /api/auth/login on submit", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(<LoginForm />);
    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "dev@test.com" },
    });
    fireEvent.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({
        method: "POST",
      }));
    });
  });

  it("shows success message after sending magic link", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(<LoginForm />);
    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "dev@test.com" },
    });
    fireEvent.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("login-success")).toBeInTheDocument();
    });
  });

  it("shows error message when login fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Rate limited" }),
    });

    render(<LoginForm />);
    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "dev@test.com" },
    });
    fireEvent.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("login-error")).toBeInTheDocument();
    });
  });
});
