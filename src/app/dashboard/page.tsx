"use client";

import { useState, useEffect } from "react";
import { createAuthClient } from "@/lib/auth";
import ProjectSetup from "@/components/ProjectSetup";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  status: string;
  residente_name: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createAuthClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        router.replace("/login");
        return;
      }

      setUserEmail(user.email);

      // Load projects
      const res = await fetch(`/api/projects?user_email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }

      setLoading(false);
    };

    init();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createAuthClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading">
        <div className="text-sm text-muted">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <header className="sticky top-0 z-40 bg-card border-b border-border bg-stars-faint">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">reti</h1>
            <p className="text-xs text-muted">{userEmail}</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost text-sm" data-testid="logout-btn">
            Salir
          </button>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {/* Project list */}
        {projects.length > 0 && (
          <div className="space-y-3 mb-6">
            <p className="section-label">Mis proyectos</p>
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 bg-card border border-border rounded-lg"
                data-testid="project-card"
              >
                <p className="text-sm font-medium text-foreground">{project.name}</p>
                <p className="text-xs text-muted mt-1">
                  Residente: {project.residente_name}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => router.push(`/project/${project.id}`)}
                    className="flex-1 text-center py-2 text-xs font-medium border border-border rounded hover:border-accent transition-colors"
                    data-testid="view-residente"
                  >
                    Vista residente
                  </button>
                  <button
                    onClick={() => router.push(`/project/${project.id}/overview`)}
                    className="flex-1 text-center py-2 text-xs font-medium bg-accent text-white rounded"
                    data-testid="view-developer"
                  >
                    Vista desarrollador
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New project */}
        {showSetup ? (
          <ProjectSetup userEmail={userEmail!} />
        ) : (
          <button
            onClick={() => setShowSetup(true)}
            className="w-full btn-secondary text-sm"
            data-testid="new-project-btn"
          >
            + Nuevo proyecto
          </button>
        )}
      </div>
    </div>
  );
}
