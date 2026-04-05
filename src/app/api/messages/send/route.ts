// POST /api/messages/send
// Send an approved message to clients via WhatsApp

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/wasender";

export async function POST(request: Request) {
  try {
    const { project_id, client_ids, message } = await request.json();

    if (!project_id || !message || !client_ids || client_ids.length === 0) {
      return NextResponse.json(
        { error: "project_id, client_ids, and message are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Load selected clients
    const { data: clients, error: clientError } = await supabase
      .from("clients")
      .select("id, name, phone, opted_in")
      .in("id", client_ids)
      .eq("project_id", project_id);

    if (clientError || !clients) {
      return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
    }

    // Only send to opted-in clients
    const optedIn = clients.filter((c) => c.opted_in);
    const results: { client_id: string; status: string; error?: string }[] = [];

    for (const client of optedIn) {
      try {
        await sendWhatsAppMessage(client.phone, message);
        results.push({ client_id: client.id, status: "sent" });

        // Log the outbound message
        await supabase.from("site_messages").insert({
          project_id,
          direction: "outbound_client",
          message_type: "text",
          content: message,
          sender_phone: client.phone,
          processed: true,
        });
      } catch (sendErr) {
        console.error(`[messages/send] Failed to send to ${client.phone}:`, sendErr);
        results.push({
          client_id: client.id,
          status: "failed",
          error: (sendErr as Error).message,
        });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({ sent, failed, results });
  } catch (error) {
    console.error("[messages/send] Error:", error);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
