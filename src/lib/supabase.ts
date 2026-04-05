import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using service role key
// Use this in API routes — bypasses RLS
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ============================================================
// Types (matching schema.sql)
// ============================================================

export type Project = {
  id: string;
  name: string;
  developer_name: string | null;
  developer_phone: string | null;
  developer_email: string | null;
  residente_name: string;
  residente_phone: string;
  status: "active" | "completed" | "archived";
  created_at: string;
};

export type TaskCategory = "progress" | "issue" | "material" | "inspection" | "expense" | "general";
export type TaskStatus = "pending" | "in_progress" | "completed" | "blocked";
export type TaskPriority = "low" | "normal" | "high" | "urgent";

export type ExpenseItem = {
  item: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type SiteTask = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  expense_amount: number | null;
  expense_currency: string;
  expense_vendor: string | null;
  expense_items: ExpenseItem[] | null;
  receipt_url: string | null;
  photos: string[] | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SitePhoto = {
  id: string;
  project_id: string;
  task_id: string | null;
  file_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  category: string | null;
  created_at: string;
};

export type SiteMessage = {
  id: string;
  project_id: string | null;
  direction: "inbound" | "outbound";
  message_type: "text" | "image" | "voice" | "document";
  content: string | null;
  media_urls: string[] | null;
  agent_intent: string | null;
  agent_actions: Record<string, unknown>[] | null;
  task_id: string | null;
  wa_message_id: string | null;
  sender_phone: string | null;
  processed: boolean;
  created_at: string;
};
