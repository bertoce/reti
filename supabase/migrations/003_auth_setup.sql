-- v0.1.1 Migration: Auth setup
-- Run this against your Supabase project
--
-- IMPORTANT: You also need to configure Supabase Auth:
-- 1. Go to Authentication > Providers in Supabase Dashboard
-- 2. Enable "Email" provider with magic link enabled
-- 3. Disable "Confirm email" (or users won't be able to log in without confirming)
-- 4. Set Site URL to your app URL (e.g., https://reti.vercel.app)
-- 5. Add redirect URLs: https://reti.vercel.app/auth/callback, http://localhost:3000/auth/callback
--
-- You also need to add NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables
-- (alongside the existing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)

-- Add developer_phone column if missing (some projects may not have it)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS developer_phone TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS developer_email TEXT;

-- Index for looking up projects by developer email
CREATE INDEX IF NOT EXISTS idx_projects_developer_email
  ON projects(developer_email) WHERE developer_email IS NOT NULL;

-- Index for looking up projects by residente phone
CREATE INDEX IF NOT EXISTS idx_projects_residente_phone
  ON projects(residente_phone);
