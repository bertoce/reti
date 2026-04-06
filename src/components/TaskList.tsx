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
      <div className="flex gap-2 px-6 py-4 overflow-x-auto" data-testid="status-filters">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={filter === opt.value ? "chip-select-active" : "chip-select"}
          >
            {opt.label}
            {opt.value !== "all" && (
              <span className="ml-1.5 opacity-60">
                {tasks.filter((t) => t.status === opt.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task groups */}
      <div className="px-6 pb-6 space-y-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16" data-testid="empty-state">
            <p className="text-sm text-muted">
              No hay tareas {filter !== "all" ? `con estado "${getStatusLabel(filter)}"` : ""}
            </p>
          </div>
        ) : (
          statusOrder.map((status) => {
            const group = grouped[status];
            if (!group || group.length === 0) return null;

            return (
              <div key={status}>
                {filter === "all" && (
                  <h2 className="section-label mb-3" data-testid="status-group-header">
                    {getStatusLabel(status)} ({group.length})
                  </h2>
                )}
                <div className="space-y-3">
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
