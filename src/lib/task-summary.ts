// Task summary aggregation — single source of truth

import type { SiteTask } from "./supabase";

export type TaskSummary = {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  blocked: number;
  total_expenses: number;
};

export function calculateTaskSummary(tasks: SiteTask[]): TaskSummary {
  return {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
    total_expenses: tasks
      .filter((t) => t.category === "expense")
      .reduce((sum, t) => sum + (t.expense_amount || 0), 0),
  };
}
