import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskDetail from "@/components/TaskDetail";
import { type SiteTask } from "@/lib/supabase";

function makeTask(overrides: Partial<SiteTask> = {}): SiteTask {
  return {
    id: "task-1",
    project_id: "proj-1",
    title: "Compra de cemento",
    description: "10 bultos para la losa",
    category: "expense",
    status: "completed",
    priority: "normal",
    expense_amount: 1800,
    expense_currency: "MXN",
    expense_vendor: "Cemex",
    expense_items: [
      { item: "Cemento", quantity: 10, unit_price: 180, subtotal: 1800 },
    ],
    receipt_url: "https://example.com/receipt.jpg",
    photos: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
    completed_at: new Date().toISOString(),
    created_at: "2026-04-04T10:30:00Z",
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("TaskDetail", () => {
  it("renders task title", () => {
    render(<TaskDetail task={makeTask()} onClose={() => {}} />);
    expect(screen.getByText("Compra de cemento")).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<TaskDetail task={makeTask()} onClose={() => {}} />);
    expect(screen.getByText("Gasto")).toBeInTheDocument();
  });

  it("renders status label", () => {
    render(<TaskDetail task={makeTask()} onClose={() => {}} />);
    expect(screen.getByText("Completado")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<TaskDetail task={makeTask()} onClose={() => {}} />);
    expect(screen.getByText("10 bultos para la losa")).toBeInTheDocument();
  });

  it("renders expense details for expense tasks", () => {
    render(<TaskDetail task={makeTask()} onClose={() => {}} />);
    expect(screen.getByTestId("expense-detail")).toBeInTheDocument();
    expect(screen.getByText("Cemex")).toBeInTheDocument();
  });

  it("renders itemized expense breakdown", () => {
    render(<TaskDetail task={makeTask()} onClose={() => {}} />);
    expect(screen.getByTestId("expense-line-item")).toBeInTheDocument();
    expect(screen.getByText(/Cemento/)).toBeInTheDocument();
  });

  it("does not render expense section for non-expense tasks", () => {
    render(
      <TaskDetail
        task={makeTask({ category: "progress", expense_amount: null })}
        onClose={() => {}}
      />
    );
    expect(screen.queryByTestId("expense-detail")).not.toBeInTheDocument();
  });

  it("renders photos", () => {
    render(<TaskDetail task={makeTask()} onClose={() => {}} />);
    expect(screen.getByTestId("task-photos")).toBeInTheDocument();
    const images = screen.getByTestId("task-photos").querySelectorAll("img");
    expect(images).toHaveLength(2);
  });

  it("renders receipt photo", () => {
    render(<TaskDetail task={makeTask()} onClose={() => {}} />);
    expect(screen.getByTestId("receipt-photo")).toBeInTheDocument();
  });

  it("calls onClose when back button is clicked", () => {
    const onClose = vi.fn();
    render(<TaskDetail task={makeTask()} onClose={onClose} />);

    fireEvent.click(screen.getByTestId("close-detail"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders priority indicator for urgent tasks", () => {
    const { container } = render(
      <TaskDetail task={makeTask({ priority: "urgent" })} onClose={() => {}} />
    );
    expect(container.textContent).toContain("🔴");
  });
});
