"use client";

import { useState, useEffect, useCallback } from "react";
import { type SiteTask, type SitePhoto } from "@/lib/supabase";
import TaskList from "@/components/TaskList";
import TaskDetail from "@/components/TaskDetail";
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
    // Poll every 15 seconds for new data
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const tabs: { value: Tab; label: string; count?: number }[] = [
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
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-base font-semibold text-foreground" data-testid="project-name">
            {projectName || "Proyecto"}
          </h1>
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-border" data-testid="tab-bar">
          {tabs.map((t) => (
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
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Tab content */}
      {tab === "tasks" && (
        <TaskList tasks={tasks} onSelectTask={setSelectedTask} />
      )}
      {tab === "expenses" && (
        <ExpenseTab tasks={tasks} onSelectTask={setSelectedTask} />
      )}
      {tab === "photos" && <PhotoGrid photos={photos} />}

      {/* Task detail overlay */}
      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
