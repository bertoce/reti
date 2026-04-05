// GET /api/tasks?project_id=...&status=...&category=...
// Returns tasks for a project with optional filters

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  if (!projectId) {
    return NextResponse.json({ error: "project_id required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  let query = supabase
    .from("site_tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also return summary counts
  const { data: allTasks } = await supabase
    .from("site_tasks")
    .select("status, category, expense_amount")
    .eq("project_id", projectId);

  const summary = {
    total: allTasks?.length || 0,
    pending: allTasks?.filter((t) => t.status === "pending").length || 0,
    in_progress: allTasks?.filter((t) => t.status === "in_progress").length || 0,
    completed: allTasks?.filter((t) => t.status === "completed").length || 0,
    blocked: allTasks?.filter((t) => t.status === "blocked").length || 0,
    total_expenses: allTasks
      ?.filter((t) => t.category === "expense")
      .reduce((sum, t) => sum + (t.expense_amount || 0), 0) || 0,
  };

  return NextResponse.json({ tasks: data, summary });
}
