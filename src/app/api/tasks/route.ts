// GET /api/tasks — list tasks with filters
// POST /api/tasks — create a new task from the dashboard

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { calculateTaskSummary } from "@/lib/task-summary";

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

  const summary = calculateTaskSummary((allTasks || []) as any[]);

  return NextResponse.json({ tasks: data, summary });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id, title, category, priority, description } = body;

    if (!project_id || !title || !category) {
      return NextResponse.json(
        { error: "project_id, title, and category are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("site_tasks")
      .insert({
        project_id,
        title,
        category,
        priority: priority || "normal",
        description: description || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ task: data }, { status: 201 });
  } catch (error) {
    console.error("[tasks] POST error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
