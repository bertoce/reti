"use client";

import { type SiteTask } from "@/lib/supabase";
import {
  formatCurrency,
  formatRelativeTime,
  getCategoryLabel,
  getCategoryColor,
  getPriorityIndicator,
} from "@/lib/format";

type Props = {
  tasks: SiteTask[];
};

export default function ActivityFeed({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 px-6" data-testid="empty-feed">
        <p className="text-sm text-muted">Sin actividad reciente</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4" data-testid="activity-feed">
      <p className="section-label mb-4">Registro de actividad</p>
      <div className="space-y-0">
        {tasks.map((task, i) => (
          <ActivityItem key={task.id} task={task} isLast={i === tasks.length - 1} />
        ))}
      </div>
    </div>
  );
}

function ActivityItem({ task, isLast }: { task: SiteTask; isLast: boolean }) {
  const priorityIcon = getPriorityIndicator(task.priority);
  const isExpense = task.category === "expense" && task.expense_amount;
  const hasPhoto = task.photos && task.photos.length > 0;

  return (
    <div
      className={`flex gap-4 py-4 ${!isLast ? "border-b border-border" : ""}`}
      data-testid="activity-item"
    >
      {/* Timeline dot */}
      <div className="shrink-0 flex flex-col items-center pt-1.5">
        <div className={`w-2 h-2 rounded-full ${getCategoryDot(task.category)}`} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Title */}
        <p className="text-sm font-medium text-foreground tracking-tight">
          {priorityIcon && <span className="mr-1.5">{priorityIcon}</span>}
          {task.title}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`chip ${getCategoryColor(task.category)}`}>
            {getCategoryLabel(task.category)}
          </span>

          {isExpense && (
            <span className="text-xs font-semibold text-foreground tabular-nums" data-testid="feed-expense-amount">
              {formatCurrency(task.expense_amount!)}
            </span>
          )}

          <span className="text-xs text-muted/50 ml-auto shrink-0">
            {formatRelativeTime(task.created_at)}
          </span>
        </div>

        {/* Photos */}
        {hasPhoto && (
          <div className="flex gap-2 mt-3" data-testid="feed-photos">
            {task.photos!.slice(0, 3).map((url, i) => (
              <div key={i} className="w-16 h-16 rounded overflow-hidden bg-subtle">
                <img src={url} alt="" className="w-full h-full object-cover photo-warm" />
              </div>
            ))}
            {task.photos!.length > 3 && (
              <div className="w-16 h-16 rounded bg-subtle flex items-center justify-center">
                <span className="text-xs text-muted">+{task.photos!.length - 3}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getCategoryDot(category: string): string {
  const dots: Record<string, string> = {
    progress: "bg-accent",
    issue: "bg-danger",
    material: "bg-warning",
    inspection: "bg-accent",
    expense: "bg-success",
    general: "bg-muted",
  };
  return dots[category] || "bg-muted";
}
