"use client";

import { useState } from "react";
import { type SiteTask } from "@/lib/supabase";
import { getStatusLabel } from "@/lib/format";
import TaskCard from "./TaskCard";

type Props = {
  tasks: SiteTask[];
  onSelectTask: (task: SiteTask) => void;
  onToggleComplete?: (task: SiteTask) => void;
};

type StatusFilter = "all" | "pending" | "in_progress" | "completed" | "blocked";

export default function TaskList({ tasks, onSelectTask, onToggleComplete }: Props) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filteredTasks = filter === "all"
    ? tasks
    : tasks.filter((t) => t.status === filter);

  // Group by status for the "all" view
  const grouped = filter === "all"
    ? groupByStatus(tasks)
    : { [filter]: filteredTasks };

  const statusOrder: StatusFilter[] = ["pending", "in_progress", "completed", "blocked"];
  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Todo" },
    { value: "pending", label: "Pendiente" },
    { value: "in_progress", label: "En progreso" },
    { value: "completed", label: "Hecho" },
  ];

  return (
    <div data-testid="task-list">
      {/* Filter chips */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto" data-testid="status-filters">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === opt.value
                ? "bg-foreground text-background"
                : "bg-[#F0F0EE] text-muted hover:bg-border"
            }`}
          >
            {opt.label}
            {opt.value !== "all" && (
              <span className="ml-1 opacity-60">
                {tasks.filter((t) => t.status === opt.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task groups */}
      <div className="px-4 pb-4 space-y-4">
        {filteredTasks.length === 0 ? (
          <p className="text-center text-sm text-muted py-8" data-testid="empty-state">
            No hay tareas {filter !== "all" ? `con estado "${getStatusLabel(filter)}"` : ""}
          </p>
        ) : (
          statusOrder.map((status) => {
            const group = grouped[status];
            if (!group || group.length === 0) return null;

            return (
              <div key={status}>
                {filter === "all" && (
                  <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2" data-testid="status-group-header">
                    {getStatusLabel(status)} ({group.length})
                  </h2>
                )}
                <div className="space-y-2">
                  {group.map((task) => (
                    <TaskCard key={task.id} task={task} onSelect={onSelectTask} onToggleComplete={onToggleComplete} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function groupByStatus(tasks: SiteTask[]): Record<string, SiteTask[]> {
  const groups: Record<string, SiteTask[]> = {};
  for (const task of tasks) {
    if (!groups[task.status]) groups[task.status] = [];
    groups[task.status].push(task);
  }
  return groups;
}
