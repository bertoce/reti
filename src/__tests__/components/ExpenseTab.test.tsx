import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ExpenseTab from "@/components/ExpenseTab";
import { type SiteTask } from "@/lib/supabase";

function makeTask(overrides: Partial<SiteTask> = {}): SiteTask {
  return {
    id: "task-" + Math.random().toString(36).slice(2),
    project_id: "proj-1",
    title: "Test expense",
    description: null,
    category: "expense",
    status: "completed",
    priority: "normal",
    expense_amount: 1000,
    expense_currency: "MXN",
    expense_vendor: "Proveedor",
    expense_items: null,
    receipt_url: null,
    photos: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("ExpenseTab", () => {
  const recentExpenses = [
    makeTask({ id: "e1", title: "Cemento", expense_amount: 1800, expense_vendor: "Cemex" }),
    makeTask({ id: "e2", title: "Varilla", expense_amount: 3200, expense_vendor: "Aceros" }),
  ];

  const mixedTasks = [
    ...recentExpenses,
    makeTask({ id: "t1", title: "Colado", category: "progress", expense_amount: null }),
  ];

  it("renders summary cards", () => {
    render(<ExpenseTab tasks={recentExpenses} onSelectTask={() => {}} />);
    expect(screen.getByTestId("expense-summary")).toBeInTheDocument();
    expect(screen.getAllByTestId("summary-card")).toHaveLength(3);
  });

  it("only shows expense tasks (filters out non-expense)", () => {
    render(<ExpenseTab tasks={mixedTasks} onSelectTask={() => {}} />);
    expect(screen.getAllByTestId("expense-card")).toHaveLength(2);
  });

  it("renders expense amounts", () => {
    render(<ExpenseTab tasks={recentExpenses} onSelectTask={() => {}} />);
    const amounts = screen.getAllByTestId("expense-card-amount");
    expect(amounts).toHaveLength(2);
  });

  it("renders vendor names", () => {
    render(<ExpenseTab tasks={recentExpenses} onSelectTask={() => {}} />);
    expect(screen.getByText("Cemex")).toBeInTheDocument();
    expect(screen.getByText("Aceros")).toBeInTheDocument();
  });

  it("shows receipt indicator when receipt_url exists", () => {
    const withReceipt = [
      makeTask({ id: "e1", title: "Cemento", expense_amount: 1800, receipt_url: "https://example.com/r.jpg" }),
    ];
    render(<ExpenseTab tasks={withReceipt} onSelectTask={() => {}} />);
    expect(screen.getByText("con recibo")).toBeInTheDocument();
  });

  it("shows empty state when no expenses", () => {
    const noExpenses = [
      makeTask({ id: "t1", category: "progress", expense_amount: null }),
    ];
    render(<ExpenseTab tasks={noExpenses} onSelectTask={() => {}} />);
    expect(screen.getByTestId("empty-expenses")).toBeInTheDocument();
  });

  it("calls onSelectTask when an expense card is clicked", () => {
    const onSelect = vi.fn();
    render(<ExpenseTab tasks={recentExpenses} onSelectTask={onSelect} />);

    fireEvent.click(screen.getAllByTestId("expense-card")[0]);
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
