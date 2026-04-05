// Media handling: download from WhatsApp, upload to Supabase Storage
import { createServiceClient } from "./supabase";
import { downloadMedia } from "./wasender";

const BUCKET = "site-photos";

// ============================================================
// Download media from WhatsApp and upload to Supabase Storage
// Returns the public URL of the uploaded file
// ============================================================
export async function processMedia(
  messageId: string,
  projectId: string,
  category: string = "general"
): Promise<string> {
  // Download from WASenderApi
  const { buffer, contentType } = await downloadMedia(messageId);

  // Determine file extension
  const ext = extensionFromContentType(contentType);
  const timestamp = Date.now();
  const path = `${projectId}/${category}/${timestamp}.${ext}`;

  // Upload to Supabase Storage
  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
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
export async function transcribeVoiceNote(messageId: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error("Missing GROQ_API_KEY");

  // Download the audio from WhatsApp
  const { buffer, contentType } = await downloadMedia(messageId);

  // Send to Groq Whisper for transcription
  const formData = new FormData();
  const ext = extensionFromContentType(contentType);
  formData.append("file", new Blob([new Uint8Array(buffer)], { type: contentType }), `voice.${ext}`);
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
