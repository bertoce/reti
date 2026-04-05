// Media handling: download from WhatsApp, upload to Supabase Storage
import { createServiceClient } from "./supabase";
import { decryptMedia } from "./wasender";

const BUCKET = "site-photos";

// ============================================================
// Download media from WhatsApp and upload to Supabase Storage
// Returns the public URL of the uploaded file
// ============================================================
export async function processMedia(
  messageId: string,
  projectId: string,
  category: string = "general",
  mediaData?: Record<string, unknown>
): Promise<string> {
  if (!mediaData) {
    throw new Error("mediaData is required to decrypt WhatsApp media");
  }

  // Decrypt and download from WASenderApi
  const { buffer, contentType } = await decryptMedia(messageId, mediaData);

  // Use the known mimetype from the webhook payload when available
  // (the decrypt response may return application/octet-stream)
  const knownMimetype = extractMimetype(mediaData) || contentType;
  const baseMimetype = knownMimetype.split(";")[0].trim();

  // Determine file extension
  const ext = extensionFromContentType(baseMimetype);
  const timestamp = Date.now();
  const path = `${projectId}/${category}/${timestamp}.${ext}`;

  // Upload to Supabase Storage
  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: baseMimetype,
      upsert: false,
    });

  if (error) {
    console.error("[media] Upload failed:", error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

// ============================================================
// Transcribe a voice note using Groq Whisper
// ============================================================
export async function transcribeVoiceNote(
  messageId: string,
  mediaData?: Record<string, unknown>
): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error("Missing GROQ_API_KEY");

  if (!mediaData) {
    throw new Error("mediaData is required to decrypt WhatsApp media");
  }

  // Decrypt and download the audio from WhatsApp
  const { buffer, contentType } = await decryptMedia(messageId, mediaData);

  // Use the known mimetype from the webhook payload (more reliable than the
  // download response header, which may return application/octet-stream)
  const audioMsg = mediaData.audioMessage as Record<string, unknown> | undefined;
  const knownMimetype = (audioMsg?.mimetype as string) || contentType;
  // Strip codec suffix for content-type matching (e.g. "audio/ogg; codecs=opus" → "audio/ogg")
  const baseMimetype = knownMimetype.split(";")[0].trim();

  // Send to Groq Whisper for transcription
  const formData = new FormData();
  const ext = extensionFromContentType(baseMimetype);
  formData.append("file", new Blob([new Uint8Array(buffer)], { type: baseMimetype }), `voice.${ext}`);
  formData.append("model", "whisper-large-v3");
  formData.append("language", "es"); // Spanish

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[media] Transcription failed:", error);
    throw new Error(`Groq transcription failed: ${response.status}`);
  }

  const result = await response.json();
  return result.text || "";
}

// ============================================================
// Helpers
// ============================================================
// Extract mimetype from raw mediaData (audioMessage, imageMessage, etc.)
function extractMimetype(mediaData: Record<string, unknown>): string | null {
  for (const key of ["audioMessage", "imageMessage", "documentMessage", "videoMessage"]) {
    const msg = mediaData[key] as Record<string, unknown> | undefined;
    if (msg?.mimetype) return msg.mimetype as string;
  }
  return null;
}

function extensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "audio/ogg": "ogg",
    "audio/opus": "opus",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "application/pdf": "pdf",
    "video/mp4": "mp4",
  };
  return map[contentType] || "bin";
}
