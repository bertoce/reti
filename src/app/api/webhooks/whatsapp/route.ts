// POST /api/webhooks/whatsapp
// Receives incoming WhatsApp messages from WASenderApi
// Stores them in site_messages and triggers agent processing

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { parseWebhookPayload, verifyWebhookSignature } from "@/lib/wasender";
import { processMessage } from "@/lib/agent";
import { processMedia } from "@/lib/media";
import { sendWhatsAppMessage } from "@/lib/wasender";
import Anthropic from "@anthropic-ai/sdk";

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
        media_data: incoming.mediaData || null,
        album_id: incoming.albumId || null,
        album_expected_count: incoming.albumExpectedCount || null,
        processed: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[webhook] Failed to store message:", error);
      return NextResponse.json({ error: "Storage failed" }, { status: 500 });
    }

    console.log(`[webhook] Stored message ${message.id} from ${incoming.from} (${incoming.type})`);

    // Album grouping: if this is part of an album, wait until all images arrive
    if (incoming.albumId && incoming.albumExpectedCount) {
      const { data: albumMessages } = await supabase
        .from("site_messages")
        .select("id")
        .eq("album_id", incoming.albumId)
        .eq("processed", false);

      const albumCount = albumMessages?.length || 0;
      if (albumCount < incoming.albumExpectedCount) {
        console.log(`[webhook] Album ${incoming.albumId}: ${albumCount}/${incoming.albumExpectedCount} photos received, waiting...`);
        return NextResponse.json({ ok: true, message_id: message.id, album_waiting: true });
      }

      // All album photos are here — process them together
      console.log(`[webhook] Album ${incoming.albumId}: all ${albumCount} photos received, processing...`);
      try {
        await processAlbum(incoming.albumId, project?.id || null);
      } catch (albumError) {
        console.error("[webhook] Album processing failed:", albumError);
      }
      return NextResponse.json({ ok: true, message_id: message.id, album_complete: true });
    }

    // Process the message inline — Vercel kills fire-and-forget fetches
    // after the response is sent, so we process before returning
    try {
      console.log(`[webhook] Processing message ${message.id} with agent...`);
      await processMessage(message.id);
      console.log(`[webhook] Agent processing complete for ${message.id}`);
    } catch (agentError) {
      console.error("[webhook] Agent processing failed:", agentError);
      // Don't fail the webhook — the message is stored, we can retry later
    }

    return NextResponse.json({ ok: true, message_id: message.id });
  } catch (error) {
    console.error("[webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ============================================================
// Process a multi-photo album as a single task
// Downloads all images, sends them to Claude together
// ============================================================
async function processAlbum(albumId: string, projectId: string | null) {
  if (!projectId) return;

  const supabase = createServiceClient();

  // Load all album messages
  const { data: albumMessages } = await supabase
    .from("site_messages")
    .select("*")
    .eq("album_id", albumId)
    .eq("processed", false)
    .order("created_at", { ascending: true });

  if (!albumMessages || albumMessages.length === 0) return;

  // Download all images
  const photoUrls: string[] = [];
  for (const msg of albumMessages) {
    if (msg.wa_message_id && msg.media_data) {
      try {
        const url = await processMedia(
          msg.wa_message_id,
          projectId,
          "incoming",
          msg.media_data
        );
        photoUrls.push(url);

        // Update the message with its photo URL
        await supabase
          .from("site_messages")
          .update({ media_urls: [url] })
          .eq("id", msg.id);
      } catch (err) {
        console.error(`[album] Failed to process media for ${msg.id}:`, err);
      }
    }
  }

  // Use the first message's caption (if any) as the album caption
  const caption = albumMessages.find((m) => m.content)?.content || null;
  const senderPhone = albumMessages[0].sender_phone;

  // Process as a single task via the first message
  // Update first message with all photo URLs so the agent sees them all
  const firstMsg = albumMessages[0];
  await supabase
    .from("site_messages")
    .update({
      media_urls: photoUrls,
      content: caption || `Álbum de ${photoUrls.length} fotos`,
    })
    .eq("id", firstMsg.id);

  // Process the first message (which now has all album context)
  await processMessage(firstMsg.id);

  // Mark all other album messages as processed
  for (const msg of albumMessages.slice(1)) {
    await supabase
      .from("site_messages")
      .update({
        processed: true,
        agent_intent: "album_grouped",
        task_id: null, // linked via the first message
      })
      .eq("id", msg.id);
  }
}
