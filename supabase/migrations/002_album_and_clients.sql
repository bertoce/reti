-- v0.1 Migration: Album grouping + Client messaging
-- Run this against your Supabase project

-- Album grouping columns on site_messages
ALTER TABLE site_messages ADD COLUMN IF NOT EXISTS album_id TEXT;
ALTER TABLE site_messages ADD COLUMN IF NOT EXISTS album_expected_count INTEGER;

CREATE INDEX IF NOT EXISTS idx_site_messages_album_id
  ON site_messages(album_id) WHERE album_id IS NOT NULL;

-- Clients table for buyer messaging
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  unit TEXT,
  opted_in BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_project_id ON clients(project_id);

-- Allow outbound_client direction in site_messages
-- (PostgreSQL doesn't enforce enum values on TEXT columns, so this is just documentation)
COMMENT ON COLUMN site_messages.direction IS 'inbound | outbound | outbound_client';
