"use client";

import { type SiteTask } from "@/lib/supabase";
import { formatCurrency, formatRelativeTime } from "@/lib/format";

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
      {/* Summary */}
      <div className="px-6 py-6" data-testid="expense-summary">
        <p className="section-label mb-4">Resumen de gastos</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="card" data-testid="summary-card">
            <p className="text-xs text-muted">Esta semana</p>
            <p className="text-sm font-bold text-foreground mt-1 tabular-nums">
              {formatCurrency(totalWeek)}
            </p>
          </div>
          <div className="card" data-testid="summary-card">
            <p className="text-xs text-muted">Este mes</p>
            <p className="text-sm font-bold text-foreground mt-1 tabular-nums">
              {formatCurrency(totalMonth)}
            </p>
          </div>
          <div className="bg-foreground text-background rounded p-6" data-testid="summary-card">
            <p className="text-xs text-background/50">Total</p>
            <p className="text-sm font-bold mt-1 tabular-nums">
              {formatCurrency(totalAll)}
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-6 pb-6">
        <p className="section-label mb-4">Detalle</p>
        {expenses.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-expenses">
            <p className="text-sm text-muted">No hay gastos registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((task) => (
              <button
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="w-full text-left card-interactive"
                data-testid="expense-card"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-foreground tracking-tight truncate">
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      {task.expense_vendor && (
                        <span className="text-xs text-muted">{task.expense_vendor}</span>
                      )}
                      {task.expense_vendor && (
                        <span className="text-xs text-muted/30">·</span>
                      )}
                      <span className="text-xs text-muted/50">
                        {formatRelativeTime(task.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-base font-bold text-foreground tabular-nums" data-testid="expense-card-amount">
                      {formatCurrency(task.expense_amount!)}
                    </span>
                    {task.receipt_url && (
                      <p className="text-xs text-accent mt-0.5">con recibo</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
