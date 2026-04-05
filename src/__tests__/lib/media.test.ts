import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/wasender", () => ({
  decryptMedia: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(),
}));

// Mock fetch for Groq API
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { processMedia, transcribeVoiceNote } from "@/lib/media";
import { decryptMedia } from "@/lib/wasender";
import { createServiceClient } from "@/lib/supabase";

const mockDecrypt = vi.mocked(decryptMedia);
const mockCreateClient = vi.mocked(createServiceClient);

const sampleImageMediaData = {
  imageMessage: {
    mimetype: "image/jpeg",
    mediaKey: "img-key-123",
    url: "https://mmg.whatsapp.net/encrypted-img",
  },
};

const sampleAudioMediaData = {
  audioMessage: {
    mimetype: "audio/ogg; codecs=opus",
    mediaKey: "audio-key-456",
    url: "https://mmg.whatsapp.net/encrypted-audio",
  },
};

describe("processMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("decrypts media and uploads to Supabase Storage", async () => {
    const testBuffer = Buffer.from("fake-image-data");

    mockDecrypt.mockResolvedValueOnce({
      buffer: testBuffer,
      contentType: "image/jpeg",
    });

    const mockUpload = vi.fn().mockResolvedValueOnce({ error: null });
    const mockGetPublicUrl = vi.fn().mockReturnValueOnce({
      data: { publicUrl: "https://storage.test.co/site-photos/proj-1/progress/123.jpg" },
    });

    mockCreateClient.mockReturnValueOnce({
      storage: {
        from: vi.fn().mockReturnValue({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        }),
      },
    } as any);

    const url = await processMedia("msg-123", "proj-1", "progress", sampleImageMediaData);

    expect(mockDecrypt).toHaveBeenCalledWith("msg-123", sampleImageMediaData);
    expect(mockUpload).toHaveBeenCalledOnce();
    expect(url).toContain("site-photos");

    // Verify the upload path includes project ID and category
    const uploadPath = mockUpload.mock.calls[0][0];
    expect(uploadPath).toContain("proj-1");
    expect(uploadPath).toContain("progress");
    expect(uploadPath).toMatch(/\.jpg$/);
  });

  it("throws when mediaData is missing", async () => {
    await expect(processMedia("msg-123", "proj-1", "progress")).rejects.toThrow(
      "mediaData is required"
    );
  });

  it("throws when upload fails", async () => {
    mockDecrypt.mockResolvedValueOnce({
      buffer: Buffer.from("data"),
      contentType: "image/png",
    });

    mockCreateClient.mockReturnValueOnce({
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValueOnce({
            error: { message: "Bucket not found" },
          }),
        }),
      },
    } as any);

    await expect(processMedia("msg-123", "proj-1", "general", sampleImageMediaData)).rejects.toThrow(
      "Storage upload failed: Bucket not found"
    );
  });

  it("uses correct file extension based on mediaData mimetype", async () => {
    const cases = [
      { mediaData: { imageMessage: { mimetype: "image/jpeg" } }, ext: "jpg" },
      { mediaData: { imageMessage: { mimetype: "image/png" } }, ext: "png" },
      { mediaData: { imageMessage: { mimetype: "image/webp" } }, ext: "webp" },
      { mediaData: { audioMessage: { mimetype: "audio/ogg; codecs=opus" } }, ext: "ogg" },
      { mediaData: { documentMessage: { mimetype: "application/pdf" } }, ext: "pdf" },
    ];

    for (const { mediaData, ext } of cases) {
      vi.clearAllMocks();

      // decryptMedia may return generic content-type — we rely on mediaData mimetype
      mockDecrypt.mockResolvedValueOnce({
        buffer: Buffer.from("data"),
        contentType: "application/octet-stream",
      });

      const mockUpload = vi.fn().mockResolvedValueOnce({ error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValueOnce({
        data: { publicUrl: `https://storage.test.co/file.${ext}` },
      });

      mockCreateClient.mockReturnValueOnce({
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl,
          }),
        },
      } as any);

      await processMedia("msg-123", "proj-1", "general", mediaData);

      const uploadPath = mockUpload.mock.calls[0][0] as string;
      expect(uploadPath).toMatch(new RegExp(`\\.${ext}$`));
    }
  });
});

describe("transcribeVoiceNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("decrypts audio and sends to Groq Whisper", async () => {
    mockDecrypt.mockResolvedValueOnce({
      buffer: Buffer.from("fake-audio"),
      contentType: "audio/ogg",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: "Hoy compramos 50 blocks de cemento" }),
    });

    const result = await transcribeVoiceNote("msg-voice", sampleAudioMediaData);

    expect(result).toBe("Hoy compramos 50 blocks de cemento");
    expect(mockDecrypt).toHaveBeenCalledWith("msg-voice", sampleAudioMediaData);
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/audio/transcriptions");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toContain("gsk_");
  });

  it("throws when mediaData is missing", async () => {
    await expect(transcribeVoiceNote("msg-voice")).rejects.toThrow(
      "mediaData is required"
    );
  });

  it("throws when Groq API fails", async () => {
    mockDecrypt.mockResolvedValueOnce({
      buffer: Buffer.from("audio"),
      contentType: "audio/ogg",
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limited",
    });

    await expect(transcribeVoiceNote("msg-voice", sampleAudioMediaData)).rejects.toThrow(
      "Groq transcription failed: 429"
    );
  });

  it("throws when GROQ_API_KEY is missing", async () => {
    const original = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    await expect(transcribeVoiceNote("msg-voice", sampleAudioMediaData)).rejects.toThrow(
      "Missing GROQ_API_KEY"
    );

    process.env.GROQ_API_KEY = original;
  });
});
