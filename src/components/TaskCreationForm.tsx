"use client";

import { useState } from "react";
import type { TaskCategory, TaskPriority } from "@/lib/supabase";

type Props = {
  onSubmit: (task: {
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
  }) => void;
  onClose: () => void;
};

const categories: { value: TaskCategory; label: string }[] = [
  { value: "progress", label: "Avance" },
  { value: "issue", label: "Problema" },
  { value: "material", label: "Material" },
  { value: "inspection", label: "Inspección" },
  { value: "expense", label: "Gasto" },
  { value: "general", label: "General" },
];

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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end" data-testid="task-creation-form">
      <div className="w-full bg-card border-t border-border rounded-t-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Nueva tarea</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground text-sm"
            data-testid="close-creation-form"
          >
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la tarea"
            className="w-full border-b border-border py-2 text-sm text-foreground bg-transparent focus:border-accent focus:outline-none transition-colors"
            autoFocus
            data-testid="task-title-input"
          />

          {/* Category chips */}
          <div>
            <p className="section-label mb-2">Categoría</p>
            <div className="flex flex-wrap gap-2" data-testid="category-select">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                    category === cat.value
                      ? "bg-accent text-white border-accent"
                      : "bg-card text-muted border-border hover:border-accent"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority chips */}
          <div>
            <p className="section-label mb-2">Prioridad</p>
            <div className="flex flex-wrap gap-2" data-testid="priority-select">
              {priorities.map((pri) => (
                <button
                  key={pri.value}
                  type="button"
                  onClick={() => setPriority(pri.value)}
                  className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                    priority === pri.value
                      ? "bg-accent text-white border-accent"
                      : "bg-card text-muted border-border hover:border-accent"
                  }`}
                >
                  {pri.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="submit-task"
          >
            Crear tarea
          </button>
        </form>
      </div>
    </div>
  );
}
