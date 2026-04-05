// Formatting utilities

export function formatCurrency(amount: number, currency: string = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return formatDate(dateString);
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    progress: "Avance",
    issue: "Problema",
    material: "Material",
    inspection: "Inspección",
    expense: "Gasto",
    general: "General",
  };
  return labels[category] || category;
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    progress: "bg-blue-100 text-blue-800",
    issue: "bg-red-100 text-red-800",
    material: "bg-amber-100 text-amber-800",
    inspection: "bg-purple-100 text-purple-800",
    expense: "bg-green-100 text-green-800",
    general: "bg-gray-100 text-gray-800",
  };
  return colors[category] || "bg-gray-100 text-gray-800";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En progreso",
    completed: "Completado",
    blocked: "Bloqueado",
  };
  return labels[status] || status;
}

export function getPriorityIndicator(priority: string): string | null {
  if (priority === "urgent") return "🔴";
  if (priority === "high") return "🟡";
  return null;
}
