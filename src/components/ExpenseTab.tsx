"use client";

import { type SiteTask } from "@/lib/supabase";
import { formatCurrency, formatRelativeTime, getCategoryColor } from "@/lib/format";

type Props = {
  tasks: SiteTask[];
  onSelectTask: (task: SiteTask) => void;
};

export default function ExpenseTab({ tasks, onSelectTask }: Props) {
  const expenses = tasks.filter((t) => t.category === "expense" && t.expense_amount);

  const totalAll = expenses.reduce((s, t) => s + (t.expense_amount || 0), 0);

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalWeek = expenses
    .filter((t) => new Date(t.created_at) >= oneWeekAgo)
    .reduce((s, t) => s + (t.expense_amount || 0), 0);

  const totalMonth = expenses
    .filter((t) => new Date(t.created_at) >= startOfMonth)
    .reduce((s, t) => s + (t.expense_amount || 0), 0);

  return (
    <div data-testid="expense-tab">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 px-4 py-3" data-testid="expense-summary">
        <SummaryCard label="Esta semana" amount={totalWeek} />
        <SummaryCard label="Este mes" amount={totalMonth} />
        <SummaryCard label="Total" amount={totalAll} highlight />
      </div>

      {/* Expense list */}
      <div className="px-4 pb-4 space-y-2">
        {expenses.length === 0 ? (
          <p className="text-center text-sm text-muted py-8" data-testid="empty-expenses">
            No hay gastos registrados
          </p>
        ) : (
          expenses.map((task) => (
            <button
              key={task.id}
              onClick={() => onSelectTask(task)}
              className="w-full text-left bg-card rounded-lg border border-border p-4 active:bg-gray-50 transition-colors"
              data-testid="expense-card"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {task.expense_vendor && (
                      <span className="text-xs text-muted">{task.expense_vendor}</span>
                    )}
                    <span className="text-xs text-muted">
                      {formatRelativeTime(task.created_at)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className="text-base font-bold text-foreground" data-testid="expense-card-amount">
                    {formatCurrency(task.expense_amount!)}
                  </span>
                  {task.receipt_url && (
                    <p className="text-xs text-muted mt-0.5">con recibo</p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  highlight = false,
}: {
  label: string;
  amount: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 text-center ${
        highlight ? "bg-foreground text-background" : "bg-card border border-border"
      }`}
      data-testid="summary-card"
    >
      <p className={`text-xs ${highlight ? "text-background/60" : "text-muted"}`}>
        {label}
      </p>
      <p className={`text-sm font-bold mt-0.5 ${highlight ? "" : "text-foreground"}`}>
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
