// Auth helpers for Supabase magic link authentication
import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client for auth operations.
 * Uses the public anon key (safe to expose in client code).
 */
export function createAuthClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Determine user role based on their identity and project data.
 */
export function getUserRole(
  user: { email: string | null; phone: string | null },
  project: { developer_email: string | null; residente_phone: string | null }
): "developer" | "residente" | null {
  if (user.email && project.developer_email && user.email === project.developer_email) {
    return "developer";
  }
  if (user.phone && project.residente_phone && user.phone === project.residente_phone) {
    return "residente";
  }
  return null;
}
