// GET /api/clients?project_id=... — list clients for a project
// POST /api/clients — create a new client

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  if (!projectId) {
    return NextResponse.json({ error: "project_id required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clients: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id, name, phone, unit } = body;

    if (!project_id || !name || !phone) {
      return NextResponse.json(
        { error: "project_id, name, and phone are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("clients")
      .insert({
        project_id,
        name,
        phone,
        unit: unit || null,
        opted_in: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ client: data }, { status: 201 });
  } catch (error) {
    console.error("[clients] POST error:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
