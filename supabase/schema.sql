-- reti v0 schema
-- Run this in your Supabase SQL editor to set up all tables

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  developer_name TEXT,
  developer_phone TEXT,
  developer_email TEXT,
  residente_name TEXT NOT NULL,
  residente_phone TEXT NOT NULL,   -- WhatsApp number, E.164 format (+1XXXXXXXXXX)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SITE TASKS
-- ============================================================
CREATE TABLE site_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('progress', 'issue', 'material', 'inspection', 'expense', 'general')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Expense fields (only used when category = 'expense')
  expense_amount NUMERIC,
  expense_currency TEXT DEFAULT 'MXN',
  expense_vendor TEXT,
  expense_items JSONB,             -- [{item, quantity, unit_price, subtotal}]
  receipt_url TEXT,

  photos TEXT[],                   -- array of storage URLs
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_site_tasks_project ON site_tasks(project_id);
CREATE INDEX idx_site_tasks_status ON site_tasks(project_id, status);
CREATE INDEX idx_site_tasks_category ON site_tasks(project_id, category);

-- ============================================================
-- SITE PHOTOS
-- ============================================================
CREATE TABLE site_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES site_tasks(id) ON DELETE SET NULL,

  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  category TEXT CHECK (category IN ('progress', 'issue', 'receipt', 'general')),

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_site_photos_project ON site_photos(project_id);
CREATE INDEX idx_site_photos_task ON site_photos(task_id);

-- ============================================================
-- SITE MESSAGES (also serves as the processing queue)
-- ============================================================
CREATE TABLE site_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'voice', 'document')),
  content TEXT,                    -- text content or voice transcription
  media_urls TEXT[],               -- attached media URLs
  media_data JSONB,                -- raw WASenderApi media metadata for decrypt-media API

  -- Agent processing metadata
  agent_intent TEXT,
  agent_actions JSONB,             -- [{tool, params, result}]
  task_id UUID REFERENCES site_tasks(id) ON DELETE SET NULL,

  wa_message_id TEXT,              -- for deduplication
  sender_phone TEXT,               -- E.164 format
  processed BOOLEAN DEFAULT false, -- queue flag: false = needs processing

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_site_messages_project ON site_messages(project_id);
CREATE INDEX idx_site_messages_unprocessed ON site_messages(processed) WHERE processed = false;
CREATE INDEX idx_site_messages_wa_id ON site_messages(wa_message_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_messages ENABLE ROW LEVEL SECURITY;

-- For v0: allow service role full access (API routes use service_role key)
-- Add user-specific policies when auth is implemented
CREATE POLICY "Service role full access" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON site_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON site_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON site_messages FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('site-photos', 'site-photos', true);

CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'site-photos');
CREATE POLICY "Service role upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site-photos');
