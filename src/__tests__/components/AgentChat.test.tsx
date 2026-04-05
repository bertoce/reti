import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AgentChat from "@/components/AgentChat";

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("AgentChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders chat input and send button", () => {
    render(<AgentChat projectId="proj-1" />);

    expect(screen.getByTestId("agent-chat")).toBeInTheDocument();
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
    expect(screen.getByTestId("chat-send")).toBeInTheDocument();
  });

  it("send button is disabled when input is empty", () => {
    render(<AgentChat projectId="proj-1" />);

    expect(screen.getByTestId("chat-send")).toBeDisabled();
  });

  it("enables send button when input has text", () => {
    render(<AgentChat projectId="proj-1" />);

    fireEvent.change(screen.getByTestId("chat-input"), {
      target: { value: "Hola" },
    });

    expect(screen.getByTestId("chat-send")).not.toBeDisabled();
  });

  it("displays user message after sending", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: "Respuesta" }),
    });

    render(<AgentChat projectId="proj-1" />);

    fireEvent.change(screen.getByTestId("chat-input"), {
      target: { value: "¿Qué tareas hay?" },
    });
    fireEvent.click(screen.getByTestId("chat-send"));

    await waitFor(() => {
      expect(screen.getByTestId("chat-messages")).toBeInTheDocument();
    });

    expect(screen.getByText("¿Qué tareas hay?")).toBeInTheDocument();
  });

  it("displays agent response after fetch completes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: "Hay 3 tareas pendientes" }),
    });

    render(<AgentChat projectId="proj-1" />);

    fireEvent.change(screen.getByTestId("chat-input"), {
      target: { value: "test" },
    });
    fireEvent.click(screen.getByTestId("chat-send"));

    await waitFor(() => {
      expect(screen.getByText("Hay 3 tareas pendientes")).toBeInTheDocument();
    });
  });

  it("shows error message when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<AgentChat projectId="proj-1" />);

    fireEvent.change(screen.getByTestId("chat-input"), {
      target: { value: "test" },
    });
    fireEvent.click(screen.getByTestId("chat-send"));

    await waitFor(() => {
      expect(screen.getByText("Error de conexión.")).toBeInTheDocument();
    });
  });

  it("clears input after sending", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: "Ok" }),
    });

    render(<AgentChat projectId="proj-1" />);

    const input = screen.getByTestId("chat-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.click(screen.getByTestId("chat-send"));

    expect(input.value).toBe("");
  });

  it("sends task context when task prop is provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: "Ok" }),
    });

    const task = {
      id: "task-1",
      project_id: "proj-1",
      title: "Colado",
      description: "Test desc",
      category: "progress" as const,
      status: "pending" as const,
      priority: "normal" as const,
      expense_amount: null,
      expense_currency: "MXN",
      expense_vendor: null,
      expense_items: null,
      receipt_url: null,
      photos: null,
      completed_at: null,
      created_at: "2026-04-04T10:00:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    };

    render(<AgentChat projectId="proj-1" task={task} />);

    fireEvent.change(screen.getByTestId("chat-input"), {
      target: { value: "info" },
    });
    fireEvent.click(screen.getByTestId("chat-send"));

    await waitFor(() => {
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.task_context).toBeDefined();
      expect(body.task_context.id).toBe("task-1");
    });
  });
});
