// GET /api/projects?user_email=... — list projects for a user
// POST /api/projects — create a new project

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("user_email");
  const userPhone = searchParams.get("user_phone");

  if (!userEmail && !userPhone) {
    return NextResponse.json(
      { error: "user_email or user_phone required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Find projects where user is either the developer or the residente
  let query = supabase.from("projects").select("*");

  if (userEmail) {
    query = query.eq("developer_email", userEmail);
  } else if (userPhone) {
    query = query.eq("residente_phone", userPhone);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, developer_email, developer_name, residente_name, residente_phone } = body;

    if (!name || !residente_name || !residente_phone) {
      return NextResponse.json(
        { error: "name, residente_name, and residente_phone are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        developer_email: developer_email || null,
        developer_name: developer_name || null,
        residente_name,
        residente_phone,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error("[projects] POST error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
