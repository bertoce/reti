"use client";

import { useState, useEffect, useCallback } from "react";
import { type SiteTask, type SitePhoto, type TaskCategory, type TaskPriority } from "@/lib/supabase";
import TaskList from "@/components/TaskList";
import TaskDetail from "@/components/TaskDetail";
import TaskCreationForm from "@/components/TaskCreationForm";
import ExpenseTab from "@/components/ExpenseTab";
import PhotoGrid from "@/components/PhotoGrid";
import { useParams } from "next/navigation";

type Tab = "tasks" | "expenses" | "photos";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [tab, setTab] = useState<Tab>("tasks");
  const [tasks, setTasks] = useState<SiteTask[]>([]);
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [projectName, setProjectName] = useState("");
  const [selectedTask, setSelectedTask] = useState<SiteTask | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, photosRes, projectRes] = await Promise.all([
        fetch(`/api/tasks?project_id=${projectId}`),
        fetch(`/api/photos?project_id=${projectId}`),
        fetch(`/api/project?id=${projectId}`),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
      if (photosRes.ok) {
        const data = await photosRes.json();
        setPhotos(data.photos || []);
      }
      if (projectRes.ok) {
        const data = await projectRes.json();
        setProjectName(data.project?.name || "");
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Mutations ──────────────────────────────────────────

  const handleToggleComplete = async (task: SiteTask) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
  }) => {
    setShowCreateForm(false);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, ...taskData }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<SiteTask>) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? data.task : t))
        );
        setSelectedTask(data.task);
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setSelectedTask(null);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete task:", err);
      await fetchData(); // Revert
    }
  };

  // ─── Render ─────────────────────────────────────────────

  const tabConfig: { value: Tab; label: string; count?: number }[] = [
    { value: "tasks", label: "Tareas", count: tasks.length },
    {
      value: "expenses",
      label: "Gastos",
      count: tasks.filter((t) => t.category === "expense").length,
    },
    { value: "photos", label: "Fotos", count: photos.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading">
        <div className="text-sm text-muted">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="project-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border bg-stars-faint">
        <div className="px-4 py-3">
          <h1 className="text-base font-semibold text-foreground" data-testid="project-name">
            {projectName || "Proyecto"}
          </h1>
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-border" data-testid="tab-bar">
          {tabConfig.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors relative ${
                tab === t.value
                  ? "text-foreground"
                  : "text-muted"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1 opacity-50">{t.count}</span>
              )}
              {tab === t.value && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Tab content */}
      {tab === "tasks" && (
        <TaskList
          tasks={tasks}
          onSelectTask={setSelectedTask}
          onToggleComplete={handleToggleComplete}
        />
      )}
      {tab === "expenses" && (
        <ExpenseTab tasks={tasks} onSelectTask={setSelectedTask} />
      )}
      {tab === "photos" && <PhotoGrid photos={photos} />}

      {/* FAB for creating tasks */}
      {tab === "tasks" && !selectedTask && !showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-2xl z-30 hover:brightness-110 active:scale-95 transition-all"
          data-testid="fab-create-task"
          aria-label="Nueva tarea"
        >
          +
        </button>
      )}

      {/* Task creation form */}
      {showCreateForm && (
        <TaskCreationForm
          onSubmit={handleCreateTask}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Task detail overlay */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          projectId={projectId}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
