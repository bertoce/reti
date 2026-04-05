import { describe, it, expect } from "vitest";
import { calculateTaskSummary } from "@/lib/task-summary";
import { makeTask } from "@/__tests__/helpers/supabase-mock";

describe("calculateTaskSummary", () => {
  it("returns zeros for empty array", () => {
    const summary = calculateTaskSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.pending).toBe(0);
    expect(summary.completed).toBe(0);
    expect(summary.total_expenses).toBe(0);
  });

  it("counts tasks by status", () => {
    const tasks = [
      makeTask({ status: "pending" }),
      makeTask({ status: "pending" }),
      makeTask({ status: "completed" }),
      makeTask({ status: "in_progress" }),
      makeTask({ status: "blocked" }),
    ];

    const summary = calculateTaskSummary(tasks);
    expect(summary.total).toBe(5);
    expect(summary.pending).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.in_progress).toBe(1);
    expect(summary.blocked).toBe(1);
  });

  it("sums expense amounts", () => {
    const tasks = [
      makeTask({ category: "expense", expense_amount: 1800 }),
      makeTask({ category: "expense", expense_amount: 500 }),
      makeTask({ category: "progress" }), // not an expense
    ];

    const summary = calculateTaskSummary(tasks);
    expect(summary.total_expenses).toBe(2300);
  });

  it("handles null expense_amount", () => {
    const tasks = [
      makeTask({ category: "expense", expense_amount: null }),
      makeTask({ category: "expense", expense_amount: 1000 }),
    ];

    const summary = calculateTaskSummary(tasks);
    expect(summary.total_expenses).toBe(1000);
  });
});
