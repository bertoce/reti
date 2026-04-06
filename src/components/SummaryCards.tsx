"use client";

import { formatCurrency, formatRelativeTime } from "@/lib/format";

type SummaryData = {
  tasks_total: number;
  tasks_pending: number;
  tasks_completed: number;
  tasks_completed_today: number;
  expenses_total: number;
  expenses_this_week: number;
  issues_open: number;
  last_activity: string | null;
};

type Props = {
  summary: SummaryData;
};

export default function SummaryCards({ summary }: Props) {
  return (
    <div className="space-y-6" data-testid="summary-cards">
      {/* Key numbers */}
      <div>
        <p className="section-label mb-4">Estado del proyecto</p>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            value={summary.tasks_pending.toString()}
            label="Pendientes"
            accent={summary.tasks_pending > 0 ? "warning" : "default"}
          />
          <StatCard
            value={summary.tasks_completed_today.toString()}
            label="Completadas hoy"
            accent="success"
          />
          <StatCard
            value={summary.issues_open.toString()}
            label="Problemas"
            accent={summary.issues_open > 0 ? "danger" : "default"}
          />
        </div>
      </div>

      {/* Expenses */}
      <div>
        <p className="section-label mb-4">Gastos</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <p className="text-xs text-muted">Esta semana</p>
            <p className="text-lg font-bold text-foreground mt-1 tabular-nums">
              {formatCurrency(summary.expenses_this_week)}
            </p>
          </div>
          <div className="bg-foreground text-background rounded p-6">
            <p className="text-xs text-background/50">Total acumulado</p>
            <p className="text-lg font-bold mt-1 tabular-nums">
              {formatCurrency(summary.expenses_total)}
            </p>
          </div>
        </div>
      </div>

      {/* Last activity */}
      <div className="flex items-center justify-between py-4 border-t border-border" data-testid="last-activity">
        <span className="section-label">Última actividad</span>
        <span className="text-sm font-medium text-foreground">
          {summary.last_activity
            ? formatRelativeTime(summary.last_activity)
            : "Sin actividad"}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  accent = "default",
}: {
  value: string;
  label: string;
  accent?: "default" | "success" | "warning" | "danger";
}) {
  const styles = {
    default: {
      bg: "card",
      value: "text-foreground",
      label: "text-muted",
    },
    success: {
      bg: "card bg-success-light border-0",
      value: "text-success",
      label: "text-success/70",
    },
    warning: {
      bg: "card bg-warning-light border-0",
      value: "text-warning",
      label: "text-warning/70",
    },
    danger: {
      bg: "card bg-danger-light border-0",
      value: "text-danger",
      label: "text-danger/70",
    },
  };

  const s = styles[accent];

  return (
    <div className={s.bg} data-testid="summary-stat-card">
      <p className={`text-2xl font-bold tabular-nums ${s.value}`}>{value}</p>
      <p className={`text-xs mt-1 ${s.label}`}>{label}</p>
    </div>
  );
}
