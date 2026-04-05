import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskCard from "@/components/TaskCard";
import { type SiteTask } from "@/lib/supabase";

function makeTask(overrides: Partial<SiteTask> = {}): SiteTask {
  return {
    id: "task-1",
    project_id: "proj-1",
    title: "Colado segundo piso",
    description: null,
    category: "progress",
    status: "completed",
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

describe("TaskCard", () => {
  it("renders task title", () => {
    render(<TaskCard task={makeTask()} onSelect={() => {}} />);
    expect(screen.getByText("Colado segundo piso")).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<TaskCard task={makeTask({ category: "issue" })} onSelect={() => {}} />);
    expect(screen.getByTestId("category-badge")).toHaveTextContent("Problema");
  });

  it("renders expense amount for expense tasks", () => {
    render(
      <TaskCard
        task={makeTask({ category: "expense", expense_amount: 1800 })}
        onSelect={() => {}}
      />
    );
    expect(screen.getByTestId("expense-amount")).toBeInTheDocument();
  });

  it("does not render expense amount for non-expense tasks", () => {
    render(<TaskCard task={makeTask()} onSelect={() => {}} />);
    expect(screen.queryByTestId("expense-amount")).not.toBeInTheDocument();
  });

  it("renders photo thumbnail when photos exist", () => {
    render(
      <TaskCard
        task={makeTask({ photos: ["https://example.com/photo.jpg"] })}
        onSelect={() => {}}
      />
    );
    expect(screen.getByRole("presentation")).toBeInTheDocument();
  });

  it("renders priority indicator for high/urgent", () => {
    const { container } = render(
      <TaskCard task={makeTask({ priority: "urgent" })} onSelect={() => {}} />
    );
    expect(container.textContent).toContain("🔴");
  });

  it("does not render priority indicator for normal", () => {
    const { container } = render(
      <TaskCard task={makeTask({ priority: "normal" })} onSelect={() => {}} />
    );
    expect(container.textContent).not.toContain("🔴");
    expect(container.textContent).not.toContain("🟡");
  });

  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    const task = makeTask();
    render(<TaskCard task={task} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId("task-card"));
    expect(onSelect).toHaveBeenCalledWith(task);
  });
});
