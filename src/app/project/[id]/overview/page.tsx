"use client";

import { useState, useEffect, useCallback } from "react";
import { type SiteTask, type SiteMessage } from "@/lib/supabase";
import SummaryCards from "@/components/SummaryCards";
import ActivityFeed from "@/components/ActivityFeed";
import ChatLog from "@/components/ChatLog";
import ClientUpdatesTab from "@/components/ClientUpdatesTab";
import { useParams } from "next/navigation";

type Tab = "overview" | "activity" | "chat" | "clients";

type ProjectData = {
  name: string;
  residente_name: string;
};

type SummaryData = {
  tasks_total: number;
  tasks_pending: number;
  tasks_completed: number;
  tasks_completed_today: number;
  expenses_total: number;
  expenses_this_week: number;
  issues_open: number;
};

export default function OverviewPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [tab, setTab] = useState<Tab>("overview");
  const [project, setProject] = useState<ProjectData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [tasks, setTasks] = useState<SiteTask[]>([]);
  const [messages, setMessages] = useState<SiteMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [projectRes, tasksRes, messagesRes] = await Promise.all([
        fetch(`/api/project?id=${projectId}`),
        fetch(`/api/tasks?project_id=${projectId}`),
        fetch(`/api/messages?project_id=${projectId}`),
      ]);

      if (projectRes.ok) {
        const data = await projectRes.json();
        setProject(data.project);
        setSummary(data.summary);
        setLastActivity(data.last_activity);
      }
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        setMessages(data.messages || []);
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

  const tabs: { value: Tab; label: string }[] = [
    { value: "overview", label: "Resumen" },
    { value: "activity", label: "Actividad" },
    { value: "chat", label: "Chat" },
    { value: "clients", label: "Clientes" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background" data-testid="loading">
        <div className="text-sm text-muted">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-stars-faint" data-testid="overview-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-sm border-b border-border">
        <div className="px-6 py-4">
          <p className="section-label mb-1">Desarrollador</p>
          <h1 className="text-base font-semibold text-foreground tracking-tight" data-testid="project-name">
            {project?.name || "Proyecto"}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex px-6" data-testid="tab-bar">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`py-3 mr-6 text-sm font-medium transition-colors relative ${
                tab === t.value
                  ? "text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
              {tab === t.value && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="px-6 pt-6">
        {tab === "overview" && summary && (
          <SummaryCards
            summary={{ ...summary, last_activity: lastActivity }}
          />
        )}
      </div>

      {tab === "activity" && <ActivityFeed tasks={tasks} />}

      {tab === "chat" && (
        <ChatLog
          messages={messages}
          residenteName={project?.residente_name || "Residente"}
        />
      )}

      {tab === "clients" && (
        <ClientUpdatesTab projectId={projectId} />
      )}
    </div>
  );
}
