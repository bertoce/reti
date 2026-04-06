"use client";

import { useState } from "react";
import type { TaskCategory, TaskPriority } from "@/lib/supabase";
import { getCategoryLabel } from "@/lib/format";

type Props = {
  onSubmit: (task: {
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
  }) => void;
  onClose: () => void;
};

const categories: TaskCategory[] = ["progress", "issue", "material", "inspection", "expense", "general"];

const priorities: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

export default function TaskCreationForm({ onSubmit, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("general");
  const [priority, setPriority] = useState<TaskPriority>("normal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), category, priority });
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end" data-testid="task-creation-form">
      <div className="w-full bg-card border-t border-border rounded-t-lg p-6 space-y-6 animate-[slideUp_0.2s_ease-out]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Nueva tarea</h2>
          <button
            onClick={onClose}
            className="btn-ghost text-sm"
            data-testid="close-creation-form"
          >
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la tarea"
            className="input-editorial text-base"
            autoFocus
            data-testid="task-title-input"
          />

          {/* Category */}
          <div>
            <p className="section-label mb-3">Categoría</p>
            <div className="flex flex-wrap gap-2" data-testid="category-select">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={category === cat ? "chip-select-active" : "chip-select"}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <p className="section-label mb-3">Prioridad</p>
            <div className="flex flex-wrap gap-2" data-testid="priority-select">
              {priorities.map((pri) => (
                <button
                  key={pri.value}
                  type="button"
                  onClick={() => setPriority(pri.value)}
                  className={priority === pri.value ? "chip-select-active" : "chip-select"}
                >
                  {pri.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
            data-testid="submit-task"
          >
            Crear tarea
          </button>
        </form>
      </div>
    </div>
  );
}
