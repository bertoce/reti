// POST /api/messages/draft
// Agent generates a client update draft from template + project data

import { NextResponse } from "next/server";
import { generateClientDraft } from "@/lib/agent";

export async function POST(request: Request) {
  try {
    const { project_id, template_type, custom_prompt } = await request.json();

    if (!project_id || !template_type) {
      return NextResponse.json(
        { error: "project_id and template_type required" },
        { status: 400 }
      );
    }

    if (!["weekly", "milestone", "custom"].includes(template_type)) {
      return NextResponse.json(
        { error: "template_type must be weekly, milestone, or custom" },
        { status: 400 }
      );
    }

    const draft = await generateClientDraft(project_id, template_type, custom_prompt);

    return NextResponse.json(draft);
  } catch (error) {
    console.error("[messages/draft] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate draft" },
      { status: 500 }
    );
  }
}
