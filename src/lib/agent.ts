// Claude agent — processes incoming messages with tool use
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "./supabase";
import { sendWhatsAppMessage } from "./wasender";
import { processMedia, transcribeVoiceNote } from "./media";

const anthropic = new Anthropic();

// ============================================================
// Tool definitions
// ============================================================
const tools: Anthropic.Tool[] = [
  {
    name: "create_task",
    description:
      "Create a new task from the residente's message. Use for progress reports, issues, material needs, inspections, and expenses. For expenses, include expense_amount and optionally expense_vendor and expense_items.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Short title for the task" },
        description: { type: "string", description: "Detailed description" },
        category: {
          type: "string",
          enum: ["progress", "issue", "material", "inspection", "expense", "general"],
        },
        priority: {
          type: "string",
          enum: ["low", "normal", "high", "urgent"],
          description: "Default normal. Use high/urgent for problems or missing materials.",
        },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed"],
          description: "Use completed if the residente is reporting something already done.",
        },
        expense_amount: { type: "number", description: "Total expense amount (only for category=expense)" },
        expense_vendor: { type: "string", description: "Vendor name (only for category=expense)" },
        expense_items: {
          type: "array",
          description: "Itemized breakdown (only for category=expense)",
          items: {
            type: "object",
            properties: {
              item: { type: "string" },
              quantity: { type: "number" },
              unit_price: { type: "number" },
              subtotal: { type: "number" },
            },
            required: ["item", "quantity", "unit_price", "subtotal"],
          },
        },
      },
      required: ["title", "category"],
    },
  },
  {
    name: "complete_task",
    description: "Mark an existing task as completed. Use when the residente reports finishing something that was previously logged.",
    input_schema: {
      type: "object" as const,
      properties: {
        task_id: { type: "string", description: "UUID of the task to complete" },
        completion_note: { type: "string", description: "Optional note about completion" },
      },
      required: ["task_id"],
    },
  },
  {
    name: "ask_clarification",
    description: "Ask the residente for more context. Use when a photo has no caption, a message is ambiguous, or you need more details.",
    input_schema: {
      type: "object" as const,
      properties: {
        question: { type: "string", description: "The question to ask in Spanish" },
      },
      required: ["question"],
    },
  },
  {
    name: "get_tasks",
    description: "Get current tasks for context. Use when the residente asks about pending work or you need to find a task to complete.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "all"],
          description: "Filter by status. Default: all",
        },
        category: { type: "string", description: "Filter by category" },
      },
    },
  },
];

// ============================================================
// Build system prompt with project context
// ============================================================
async function buildSystemPrompt(projectId: string): Promise<string> {
  const supabase = createServiceClient();

  // Load project
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error(`Project ${projectId} not found`);

  // Load recent tasks (last 20)
  const { data: recentTasks } = await supabase
    .from("site_tasks")
    .select("id, title, category, status, priority, expense_amount, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Calculate weekly expense total
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: weekExpenses } = await supabase
    .from("site_tasks")
    .select("expense_amount")
    .eq("project_id", projectId)
    .eq("category", "expense")
    .gte("created_at", oneWeekAgo);

  const weeklyTotal = (weekExpenses || []).reduce(
    (sum, e) => sum + (e.expense_amount || 0),
    0
  );

  const taskList = (recentTasks || [])
    .map(
      (t) =>
        `- [${t.status}] ${t.title} (${t.category}${t.priority === "urgent" || t.priority === "high" ? ", " + t.priority : ""}${t.expense_amount ? ", $" + t.expense_amount : ""}) — id: ${t.id}`
    )
    .join("\n");

  return `You are the reti assistant for a construction project. You help the residente de obra (site supervisor) track tasks, log expenses, and organize progress photos via WhatsApp.

PROJECT: ${project.name}
RESIDENTE: ${project.residente_name}

CURRENT TASKS (most recent first):
${taskList || "(no tasks yet)"}

WEEKLY EXPENSE TOTAL: $${weeklyTotal.toLocaleString()} MXN

RULES:
- Always respond in Spanish
- Keep confirmations short (1-2 lines max)
- When you receive a photo with a caption about progress, create a task with status "completed"
- When you receive a photo with no caption, ask what it's about: "¿Avance, problema, o gasto?"
- When you receive expense info (amounts, receipts, materials), create a task with category "expense"
- For receipt photos, extract the vendor, total, and line items if visible
- When the residente mentions a problem or something missing, set priority to "high"
- Use ✓ at the start of confirmations so the residente knows it was processed
- When completing an existing task, use complete_task with the task's id
- If unsure which task to complete, use get_tasks first to check`;
}

// ============================================================
// Process a single message
// ============================================================
export async function processMessage(messageId: string) {
  const supabase = createServiceClient();

  // Load the unprocessed message
  const { data: message, error: msgError } = await supabase
    .from("site_messages")
    .select("*")
    .eq("id", messageId)
    .single();

  if (msgError || !message) {
    console.error("[agent] Message not found:", messageId);
    return;
  }

  if (message.processed) {
    console.log("[agent] Message already processed:", messageId);
    return;
  }

  if (!message.project_id) {
    console.error("[agent] Message has no project_id:", messageId);
    await supabase
      .from("site_messages")
      .update({ processed: true })
      .eq("id", messageId);
    return;
  }

  try {
    // Build the system prompt with project context
    const systemPrompt = await buildSystemPrompt(message.project_id);

    // Build the user message content
    const userContent: Anthropic.ContentBlockParam[] = [];

    // Handle voice notes — transcribe first
    let textContent = message.content || "";
    if (message.message_type === "voice" && message.wa_message_id) {
      try {
        textContent = await transcribeVoiceNote(message.wa_message_id);
        // Update the message with the transcription
        await supabase
          .from("site_messages")
          .update({ content: textContent })
          .eq("id", messageId);
      } catch (err) {
        console.error("[agent] Voice transcription failed:", err);
        textContent = "(voice note — transcription failed)";
      }
    }

    // Handle images — download and include as vision input
    if (message.message_type === "image" && message.wa_message_id) {
      try {
        const photoUrl = await processMedia(
          message.wa_message_id,
          message.project_id,
          "incoming"
        );

        // Store the photo URL on the message
        await supabase
          .from("site_messages")
          .update({ media_urls: [photoUrl] })
          .eq("id", messageId);

        // Add image to Claude's input
        userContent.push({
          type: "image",
          source: { type: "url", url: photoUrl },
        });
      } catch (err) {
        console.error("[agent] Media processing failed:", err);
      }
    }

    // Add text content
    if (textContent) {
      userContent.push({ type: "text", text: textContent });
    }

    // If no content at all, skip
    if (userContent.length === 0) {
      console.log("[agent] No content to process for message:", messageId);
      await supabase
        .from("site_messages")
        .update({ processed: true })
        .eq("id", messageId);
      return;
    }

    // Call Claude
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: [{ role: "user", content: userContent }],
    });

    // Process tool calls in a loop (Claude may chain multiple tools)
    const executedActions: Record<string, unknown>[] = [];
    let taskId: string | null = null;
    let replyText = "";

    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (block: Anthropic.Messages.ContentBlock): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use"
      );

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
          message.project_id,
          message.media_urls || []
        );

        executedActions.push({
          tool: toolUse.name,
          params: toolUse.input,
          result,
        });

        if (result.task_id) taskId = result.task_id as string;

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // Continue the conversation with tool results
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages: [
          { role: "user", content: userContent },
          { role: "assistant", content: response.content },
          { role: "user", content: toolResults },
        ],
      });
    }

    // Extract final text response
    const textBlocks = response.content.filter(
      (block: Anthropic.Messages.ContentBlock): block is Anthropic.Messages.TextBlock => block.type === "text"
    );
    replyText = textBlocks.map((b: Anthropic.Messages.TextBlock) => b.text).join("\n");

    // Send confirmation back via WhatsApp
    if (replyText && message.sender_phone) {
      await sendWhatsAppMessage(message.sender_phone, replyText);

      // Log the outbound message
      await supabase.from("site_messages").insert({
        project_id: message.project_id,
        direction: "outbound",
        message_type: "text",
        content: replyText,
        sender_phone: message.sender_phone,
        processed: true,
      });
    }

    // Mark the original message as processed
    await supabase
      .from("site_messages")
      .update({
        processed: true,
        agent_intent: executedActions[0]?.tool as string || null,
        agent_actions: executedActions.length > 0 ? executedActions : null,
        task_id: taskId,
      })
      .eq("id", messageId);

    console.log(`[agent] Processed message ${messageId}: ${executedActions.length} actions, reply: "${replyText.slice(0, 80)}..."`);
  } catch (error) {
    console.error("[agent] Processing failed for message:", messageId, error);
    // Don't mark as processed so it can be retried
  }
}

// ============================================================
// Execute a single tool call
// ============================================================
async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  projectId: string,
  photoUrls: string[]
): Promise<Record<string, unknown>> {
  const supabase = createServiceClient();

  switch (toolName) {
    case "create_task": {
      const taskData = {
        project_id: projectId,
        title: input.title as string,
        description: (input.description as string) || null,
        category: input.category as string,
        priority: (input.priority as string) || "normal",
        status: (input.status as string) || "pending",
        expense_amount: (input.expense_amount as number) || null,
        expense_vendor: (input.expense_vendor as string) || null,
        expense_items: (input.expense_items as unknown[]) || null,
        photos: photoUrls.length > 0 ? photoUrls : null,
        receipt_url: input.category === "expense" && photoUrls.length > 0 ? photoUrls[0] : null,
        completed_at: input.status === "completed" ? new Date().toISOString() : null,
      };

      const { data: task, error } = await supabase
        .from("site_tasks")
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error("[agent] create_task failed:", error);
        return { success: false, error: error.message };
      }

      // Also create site_photos entries for any attached photos
      if (photoUrls.length > 0) {
        const photoRecords = photoUrls.map((url) => ({
          project_id: projectId,
          task_id: task.id,
          file_url: url,
          caption: (input.title as string) || null,
          category: input.category === "expense" ? "receipt" : "progress",
        }));

        await supabase.from("site_photos").insert(photoRecords);
      }

      return { success: true, task_id: task.id, title: task.title };
    }

    case "complete_task": {
      const { error } = await supabase
        .from("site_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          description: input.completion_note
            ? `${input.completion_note}`
            : undefined,
        })
        .eq("id", input.task_id as string)
        .eq("project_id", projectId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, task_id: input.task_id };
    }

    case "ask_clarification": {
      // The question will be sent as the reply text by the main loop
      return { success: true, question: input.question };
    }

    case "get_tasks": {
      let query = supabase
        .from("site_tasks")
        .select("id, title, category, status, priority, expense_amount, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(15);

      if (input.status && input.status !== "all") {
        query = query.eq("status", input.status as string);
      }
      if (input.category) {
        query = query.eq("category", input.category as string);
      }

      const { data: tasks } = await query;
      return { success: true, tasks: tasks || [] };
    }

    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}
