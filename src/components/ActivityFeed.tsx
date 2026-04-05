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
      <p className="text-center text-sm text-muted py-8" data-testid="empty-feed">
        Sin actividad reciente
      </p>
    );
  }

  return (
    <div className="space-y-1" data-testid="activity-feed">
      {tasks.map((task) => (
        <ActivityItem key={task.id} task={task} />
      ))}
    </div>
  );
}

function ActivityItem({ task }: { task: SiteTask }) {
  const priorityIcon = getPriorityIndicator(task.priority);
  const isExpense = task.category === "expense" && task.expense_amount;
  const hasPhoto = task.photos && task.photos.length > 0;

  return (
    <div
      className="flex gap-3 px-4 py-3 border-b border-border last:border-b-0"
      data-testid="activity-item"
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5">
        <span className="text-base">{getActivityIcon(task.category)}</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Title */}
        <p className="text-sm text-foreground">
          {priorityIcon && <span className="mr-1">{priorityIcon}</span>}
          {task.title}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`inline-block px-1.5 py-0.5 text-xs rounded ${getCategoryColor(task.category)}`}
          >
            {getCategoryLabel(task.category)}
          </span>

          {isExpense && (
            <span className="text-xs font-semibold text-foreground" data-testid="feed-expense-amount">
              {formatCurrency(task.expense_amount!)}
            </span>
          )}

          <span className="text-xs text-muted ml-auto shrink-0">
            {formatRelativeTime(task.created_at)}
          </span>
        </div>

        {/* Photo preview */}
        {hasPhoto && (
          <div className="flex gap-1.5 mt-2" data-testid="feed-photos">
            {task.photos!.slice(0, 3).map((url, i) => (
              <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {task.photos!.length > 3 && (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-muted">+{task.photos!.length - 3}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getActivityIcon(category: string): string {
  const icons: Record<string, string> = {
    progress: "🔨",
    issue: "⚠️",
    material: "📦",
    inspection: "🔍",
    expense: "💰",
    general: "📋",
  };
  return icons[category] || "📋";
}
