// GET /api/project?id=...
// Returns project details + summary stats

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("id");

  if (!projectId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Load project
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Load summary stats
  const { data: tasks } = await supabase
    .from("site_tasks")
    .select("status, category, expense_amount, created_at")
    .eq("project_id", projectId);

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const summary = {
    tasks_total: tasks?.length || 0,
    tasks_pending: tasks?.filter((t) => t.status === "pending").length || 0,
    tasks_completed: tasks?.filter((t) => t.status === "completed").length || 0,
    tasks_completed_today: tasks?.filter(
      (t) => t.status === "completed" && t.created_at >= new Date(now.setHours(0, 0, 0, 0)).toISOString()
    ).length || 0,
    expenses_total: tasks
      ?.filter((t) => t.category === "expense")
      .reduce((sum, t) => sum + (t.expense_amount || 0), 0) || 0,
    expenses_this_week: tasks
      ?.filter((t) => t.category === "expense" && t.created_at >= oneWeekAgo)
      .reduce((sum, t) => sum + (t.expense_amount || 0), 0) || 0,
    issues_open: tasks?.filter((t) => t.category === "issue" && t.status !== "completed").length || 0,
  };

  // Last activity
  const { data: lastMessage } = await supabase
    .from("site_messages")
    .select("created_at")
    .eq("project_id", projectId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    project,
    summary,
    last_activity: lastMessage?.created_at || null,
  });
}
