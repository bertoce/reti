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
  task: SiteTask;
  onSelect: (task: SiteTask) => void;
  onToggleComplete?: (task: SiteTask) => void;
};

export default function TaskCard({ task, onSelect, onToggleComplete }: Props) {
  const priorityIcon = getPriorityIndicator(task.priority);
  const hasPhoto = task.photos && task.photos.length > 0;
  const isExpense = task.category === "expense" && task.expense_amount;
  const isCompleted = task.status === "completed";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete?.(task);
  };

  return (
    <button
      onClick={() => onSelect(task)}
      className="w-full text-left card-interactive"
      data-testid="task-card"
    >
      <div className="flex items-start gap-3">
        {/* Completion toggle */}
        {onToggleComplete && (
          <div
            onClick={handleToggle}
            className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
              isCompleted
                ? "bg-success border-success text-white"
                : "border-border hover:border-accent"
            }`}
            role="checkbox"
            aria-checked={isCompleted}
            data-testid="completion-toggle"
          >
            {isCompleted && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}

        {/* Thumbnail */}
        {hasPhoto && (
          <div className="shrink-0 w-14 h-14 rounded overflow-hidden bg-subtle">
            <img
              src={task.photos![0]}
              alt=""
              className="w-full h-full object-cover photo-warm"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2">
            {priorityIcon && <span className="text-sm">{priorityIcon}</span>}
            <h3 className={`text-sm font-medium tracking-tight truncate ${isCompleted ? "text-muted line-through" : "text-foreground"}`}>
              {task.title}
            </h3>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`chip ${getCategoryColor(task.category)}`}
              data-testid="category-badge"
            >
              {getCategoryLabel(task.category)}
            </span>

            {isExpense && (
              <span className="text-sm font-semibold text-foreground tabular-nums" data-testid="expense-amount">
                {formatCurrency(task.expense_amount!)}
              </span>
            )}

            <span className="text-xs text-muted/60 ml-auto">
              {formatRelativeTime(task.created_at)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
