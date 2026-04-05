// POST /api/agent/process
// Processes a single message through the Claude agent
// Called by the webhook handler after storing the message

import { NextResponse } from "next/server";
import { processMessage } from "@/lib/agent";

export async function POST(request: Request) {
  try {
    const { message_id } = await request.json();

    if (!message_id) {
      return NextResponse.json({ error: "message_id required" }, { status: 400 });
    }

    // Process the message (this does all the work)
    await processMessage(message_id);

    return NextResponse.json({ ok: true, message_id });
  } catch (error) {
    console.error("[agent/process] Error:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}

// Also support GET for manual processing of unprocessed messages
// Useful for development and catching any missed messages
export async function GET() {
  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();

    // Find unprocessed messages
    const { data: messages } = await supabase
      .from("site_messages")
      .select("id")
      .eq("processed", false)
      .eq("direction", "inbound")
      .order("created_at", { ascending: true })
      .limit(10);

    if (!messages || messages.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    // Process each message sequentially
    let processed = 0;
    for (const msg of messages) {
      try {
        await processMessage(msg.id);
        processed++;
      } catch (err) {
        console.error(`[agent/process] Failed to process ${msg.id}:`, err);
      }
    }

    return NextResponse.json({ ok: true, processed, total: messages.length });
  } catch (error) {
    console.error("[agent/process] GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
