// POST /api/webhooks/whatsapp
// Receives incoming WhatsApp messages from WASenderApi
// Stores them in site_messages and triggers agent processing

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { parseWebhookPayload, verifyWebhookSignature } from "@/lib/wasender";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // DEBUG: Log the raw payload so we can see what WASenderApi sends
    console.log("[webhook] Raw payload:", rawBody.substring(0, 2000));
    console.log("[webhook] Headers:", JSON.stringify({
      "x-wasender-signature": request.headers.get("x-wasender-signature"),
      "x-webhook-signature": request.headers.get("x-webhook-signature"),
      "content-type": request.headers.get("content-type"),
    }));

    // Verify webhook signature
    const signature = request.headers.get("x-wasender-signature") ||
                      request.headers.get("x-webhook-signature");
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn("[webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // Parse the incoming message
    const incoming = parseWebhookPayload(body);
    if (!incoming) {
      // Not a user message (could be a status update, etc.) — ignore
      console.log("[webhook] parseWebhookPayload returned null. Body keys:", Object.keys(body));
      return NextResponse.json({ ok: true });
    }

    console.log("[webhook] Parsed message:", JSON.stringify(incoming));

    const supabase = createServiceClient();

    // Deduplicate: check if we already have this message
    if (incoming.messageId) {
      const { data: existing } = await supabase
        .from("site_messages")
        .select("id")
        .eq("wa_message_id", incoming.messageId)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log("[webhook] Duplicate message, skipping:", incoming.messageId);
        return NextResponse.json({ ok: true });
      }
    }

    // Find the project for this phone number
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("residente_phone", incoming.from)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!project) {
      console.warn("[webhook] No project found for phone:", incoming.from);
      // Still store the message for debugging, but without a project_id
    }

    // Store the message (unprocessed — agent will pick it up)
    const { data: message, error } = await supabase
      .from("site_messages")
      .insert({
        project_id: project?.id || null,
        direction: "inbound",
        message_type: incoming.type,
        content: incoming.text || incoming.caption || null,
        sender_phone: incoming.from,
        wa_message_id: incoming.messageId,
        processed: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[webhook] Failed to store message:", error);
      return NextResponse.json({ error: "Storage failed" }, { status: 500 });
    }

    console.log(`[webhook] Stored message ${message.id} from ${incoming.from} (${incoming.type})`);

    // Trigger agent processing asynchronously
    // In production, this would be a queue worker or edge function
    // For v0, we fire-and-forget to the processing endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get("host")}`;

    fetch(`${baseUrl}/api/agent/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: message.id }),
    }).catch((err) => {
      console.error("[webhook] Failed to trigger agent:", err);
    });

    // Return 200 immediately — WhatsApp expects a fast response
    return NextResponse.json({ ok: true, message_id: message.id });
  } catch (error) {
    console.error("[webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
