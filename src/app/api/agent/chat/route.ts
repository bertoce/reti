// POST /api/agent/chat
// Dashboard-initiated conversation with the agent
// Lighter weight than processMessage — no WhatsApp, no media

import { NextResponse } from "next/server";
import { chatWithAgent } from "@/lib/agent";

export async function POST(request: Request) {
  try {
    const { project_id, message, task_context } = await request.json();

    if (!project_id || !message) {
      return NextResponse.json(
        { error: "project_id and message are required" },
        { status: 400 }
      );
    }

    const reply = await chatWithAgent(project_id, message, task_context);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[agent/chat] Error:", error);
    return NextResponse.json(
      { error: "Agent chat failed" },
      { status: 500 }
    );
  }
}
