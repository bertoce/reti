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
};

export default function TaskCard({ task, onSelect }: Props) {
  const priorityIcon = getPriorityIndicator(task.priority);
  const hasPhoto = task.photos && task.photos.length > 0;
  const isExpense = task.category === "expense" && task.expense_amount;

  return (
    <button
      onClick={() => onSelect(task)}
      className="w-full text-left bg-card rounded-xl border border-border p-4 active:bg-gray-50 transition-colors"
      data-testid="task-card"
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        {hasPhoto && (
          <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={task.photos![0]}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2">
            {priorityIcon && <span className="text-sm">{priorityIcon}</span>}
            <h3 className="text-sm font-medium text-foreground truncate">
              {task.title}
            </h3>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(task.category)}`}
              data-testid="category-badge"
            >
              {getCategoryLabel(task.category)}
            </span>

            {isExpense && (
              <span className="text-sm font-semibold text-foreground" data-testid="expense-amount">
                {formatCurrency(task.expense_amount!)}
              </span>
            )}

            <span className="text-xs text-muted ml-auto">
              {formatRelativeTime(task.created_at)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
