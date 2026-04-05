// GET /api/cron/retry
// Reprocesses stale unprocessed messages (older than 5 minutes)
// Intended to be called by Vercel Cron every 5 minutes

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { processMessage } from "@/lib/agent";

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Find unprocessed inbound messages older than 5 minutes
    // Exclude incomplete albums (where album_expected_count > received count)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: staleMessages } = await supabase
      .from("site_messages")
      .select("id, album_id, album_expected_count")
      .eq("processed", false)
      .eq("direction", "inbound")
      .lt("created_at", fiveMinAgo)
      .order("created_at", { ascending: true })
      .limit(10);

    if (!staleMessages || staleMessages.length === 0) {
      return NextResponse.json({ ok: true, retried: 0 });
    }

    // Filter out messages that are part of incomplete albums
    const toRetry: string[] = [];
    for (const msg of staleMessages) {
      if (msg.album_id && msg.album_expected_count) {
        // Check if all album photos have arrived
        const { data: albumMsgs } = await supabase
          .from("site_messages")
          .select("id")
          .eq("album_id", msg.album_id);

        if ((albumMsgs?.length || 0) < msg.album_expected_count) {
          continue; // Skip — album is still incomplete
        }
      }
      toRetry.push(msg.id);
    }

    let retried = 0;
    for (const id of toRetry) {
      try {
        await processMessage(id);
        retried++;
      } catch (err) {
        console.error(`[cron/retry] Failed to reprocess ${id}:`, err);
      }
    }

    return NextResponse.json({ ok: true, retried, total: toRetry.length });
  } catch (error) {
    console.error("[cron/retry] Error:", error);
    return NextResponse.json({ error: "Retry failed" }, { status: 500 });
  }
}
