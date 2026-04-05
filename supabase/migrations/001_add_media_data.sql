-- Add media_data column to store raw WASenderApi media metadata
-- needed by the decrypt-media API to download voice notes, images, and documents
ALTER TABLE site_messages ADD COLUMN IF NOT EXISTS media_data JSONB;
