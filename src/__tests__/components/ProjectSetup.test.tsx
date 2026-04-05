import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

import ProjectSetup from "@/components/ProjectSetup";

describe("ProjectSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders project name, residente name, and residente phone inputs", () => {
    render(<ProjectSetup userEmail="dev@test.com" />);
    expect(screen.getByTestId("project-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("residente-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("residente-phone-input")).toBeInTheDocument();
  });

  it("submit is disabled when required fields are empty", () => {
    render(<ProjectSetup userEmail="dev@test.com" />);
    expect(screen.getByTestId("create-project-submit")).toBeDisabled();
  });

  it("enables submit when all required fields are filled", () => {
    render(<ProjectSetup userEmail="dev@test.com" />);

    fireEvent.change(screen.getByTestId("project-name-input"), {
      target: { value: "Casa Reforma" },
    });
    fireEvent.change(screen.getByTestId("residente-name-input"), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByTestId("residente-phone-input"), {
      target: { value: "+521234567890" },
    });

    expect(screen.getByTestId("create-project-submit")).not.toBeDisabled();
  });

  it("calls POST /api/projects on submit", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ project: { id: "proj-new", name: "Casa Reforma" } }),
    });

    render(<ProjectSetup userEmail="dev@test.com" />);

    fireEvent.change(screen.getByTestId("project-name-input"), {
      target: { value: "Casa Reforma" },
    });
    fireEvent.change(screen.getByTestId("residente-name-input"), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByTestId("residente-phone-input"), {
      target: { value: "+521234567890" },
    });
    fireEvent.click(screen.getByTestId("create-project-submit"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/projects", expect.objectContaining({
        method: "POST",
      }));
    });
  });

  it("includes developer_email from prop in the POST body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ project: { id: "proj-new" } }),
    });

    render(<ProjectSetup userEmail="dev@test.com" />);

    fireEvent.change(screen.getByTestId("project-name-input"), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByTestId("residente-name-input"), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByTestId("residente-phone-input"), {
      target: { value: "+521234" },
    });
    fireEvent.click(screen.getByTestId("create-project-submit"));

    await waitFor(() => {
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.developer_email).toBe("dev@test.com");
    });
  });
});
