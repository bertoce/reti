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
    <div className="space-y-3" data-testid="summary-cards">
      {/* Top row: key numbers */}
      <div className="grid grid-cols-3 gap-3">
        <Card
          label="Pendientes"
          value={summary.tasks_pending.toString()}
          accent={summary.tasks_pending > 0 ? "warning" : "default"}
        />
        <Card
          label="Hoy"
          value={summary.tasks_completed_today.toString()}
          sublabel="completadas"
          accent="success"
        />
        <Card
          label="Problemas"
          value={summary.issues_open.toString()}
          accent={summary.issues_open > 0 ? "danger" : "default"}
        />
      </div>

      {/* Expense row */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          label="Gastos esta semana"
          value={formatCurrency(summary.expenses_this_week)}
        />
        <Card
          label="Gastos total"
          value={formatCurrency(summary.expenses_total)}
          accent="highlight"
        />
      </div>

      {/* Activity indicator */}
      <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between" data-testid="last-activity">
        <span className="text-xs text-muted">Última actividad</span>
        <span className="text-sm font-medium text-foreground">
          {summary.last_activity
            ? formatRelativeTime(summary.last_activity)
            : "Sin actividad"}
        </span>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  sublabel,
  accent = "default",
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "default" | "success" | "warning" | "danger" | "highlight";
}) {
  const accentClasses = {
    default: "bg-card border border-border",
    success: "bg-success-light border border-success/20",
    warning: "bg-warning-light border border-warning/20",
    danger: "bg-danger-light border border-danger/20",
    highlight: "bg-foreground text-background",
  };

  const valueClasses = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    highlight: "text-background",
  };

  const labelClasses = {
    default: "text-muted",
    success: "text-success/70",
    warning: "text-warning/70",
    danger: "text-danger/70",
    highlight: "text-background/60",
  };

  return (
    <div
      className={`rounded-lg px-3 py-3 ${accentClasses[accent]}`}
      data-testid="summary-stat-card"
    >
      <p className={`text-xs ${labelClasses[accent]}`}>{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${valueClasses[accent]}`}>
        {value}
      </p>
      {sublabel && (
        <p className={`text-xs ${labelClasses[accent]}`}>{sublabel}</p>
      )}
    </div>
  );
}
