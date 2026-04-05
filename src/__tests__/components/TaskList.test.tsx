import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskList from "@/components/TaskList";
import { type SiteTask } from "@/lib/supabase";

function makeTask(overrides: Partial<SiteTask> = {}): SiteTask {
  return {
    id: "task-" + Math.random().toString(36).slice(2),
    project_id: "proj-1",
    title: "Test task",
    description: null,
    category: "progress",
    status: "pending",
    priority: "normal",
    expense_amount: null,
    expense_currency: "MXN",
    expense_vendor: null,
    expense_items: null,
    receipt_url: null,
    photos: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

const sampleTasks: SiteTask[] = [
  makeTask({ id: "t1", title: "Colado terminado", status: "completed", category: "progress" }),
  makeTask({ id: "t2", title: "Falta tubería", status: "pending", category: "material" }),
  makeTask({ id: "t3", title: "Compra cemento", status: "completed", category: "expense", expense_amount: 1800 }),
  makeTask({ id: "t4", title: "Revisar instalación", status: "pending", category: "inspection" }),
];

describe("TaskList", () => {
  it("renders all tasks by default", () => {
    render(<TaskList tasks={sampleTasks} onSelectTask={() => {}} />);
    expect(screen.getAllByTestId("task-card")).toHaveLength(4);
  });

  it("renders filter chips", () => {
    render(<TaskList tasks={sampleTasks} onSelectTask={() => {}} />);
    expect(screen.getByTestId("status-filters")).toBeInTheDocument();
    expect(screen.getByText("Todo")).toBeInTheDocument();
    expect(screen.getAllByText(/Pendiente/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hecho/).length).toBeGreaterThan(0);
  });

  it("filters tasks when a filter chip is clicked", () => {
    render(<TaskList tasks={sampleTasks} onSelectTask={() => {}} />);

    // Click "Pendiente" filter (first match is the filter chip within status-filters)
    const filterBar = screen.getByTestId("status-filters");
    const pendienteChip = Array.from(filterBar.querySelectorAll("button"))
      .find((btn) => btn.textContent?.includes("Pendiente"));
    fireEvent.click(pendienteChip!);

    const cards = screen.getAllByTestId("task-card");
    expect(cards).toHaveLength(2); // t2 and t4 are pending
  });

  it("shows status group headers in all view", () => {
    render(<TaskList tasks={sampleTasks} onSelectTask={() => {}} />);
    const headers = screen.getAllByTestId("status-group-header");
    expect(headers.length).toBeGreaterThan(0);
  });

  it("shows empty state when no tasks match filter", () => {
    render(<TaskList tasks={sampleTasks} onSelectTask={() => {}} />);

    // Click "En progreso" — no tasks have this status
    fireEvent.click(screen.getByText(/En progreso/));

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("shows empty state when no tasks at all", () => {
    render(<TaskList tasks={[]} onSelectTask={() => {}} />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("calls onSelectTask when a task card is clicked", () => {
    const onSelect = vi.fn();
    render(<TaskList tasks={sampleTasks} onSelectTask={onSelect} />);

    fireEvent.click(screen.getAllByTestId("task-card")[0]);
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
