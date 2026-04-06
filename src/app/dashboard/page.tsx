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
      <div className="flex items-center justify-center min-h-screen bg-background" data-testid="loading">
        <div className="text-sm text-muted">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-heading text-foreground tracking-tight">reti</h1>
            <p className="text-xs text-muted mt-1">{userEmail}</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost text-sm" data-testid="logout-btn">
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Project list */}
        {projects.length > 0 && (
          <div className="mb-12">
            <p className="section-label mb-6">Mis proyectos</p>
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="card"
                  data-testid="project-card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-base font-semibold text-foreground tracking-tight">
                        {project.name}
                      </p>
                      <p className="text-sm text-muted mt-1">
                        Residente: {project.residente_name}
                      </p>
                    </div>
                    <span className="chip bg-subtle text-muted">
                      {project.status === "active" ? "Activo" : project.status}
                    </span>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <button
                      onClick={() => router.push(`/project/${project.id}`)}
                      className="flex-1 btn-secondary text-sm py-2.5"
                      data-testid="view-residente"
                    >
                      Vista residente
                    </button>
                    <button
                      onClick={() => router.push(`/project/${project.id}/overview`)}
                      className="flex-1 btn-primary text-sm py-2.5"
                      data-testid="view-developer"
                    >
                      Vista desarrollador
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {projects.length === 0 && !showSetup && (
          <div className="text-center py-20">
            <h2 className="text-heading text-foreground tracking-tight">
              Bienvenido a reti
            </h2>
            <p className="text-sm text-muted mt-3 mb-8 leading-relaxed max-w-xs mx-auto">
              Crea tu primer proyecto para comenzar a dar seguimiento a tu obra.
            </p>
            <button
              onClick={() => setShowSetup(true)}
              className="btn-primary"
              data-testid="new-project-btn"
            >
              Crear primer proyecto
            </button>
          </div>
        )}

        {/* New project button (when projects exist) */}
        {projects.length > 0 && !showSetup && (
          <button
            onClick={() => setShowSetup(true)}
            className="w-full btn-secondary text-sm"
            data-testid="new-project-btn"
          >
            + Nuevo proyecto
          </button>
        )}

        {/* Project setup form */}
        {showSetup && (
          <div className="card">
            <ProjectSetup userEmail={userEmail!} />
          </div>
        )}
      </div>
    </div>
  );
}
