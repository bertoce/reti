import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/wasender", () => ({
  downloadMedia: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  createServiceClient: vi.fn(),
}));

// Mock fetch for Groq API
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { processMedia, transcribeVoiceNote } from "@/lib/media";
import { downloadMedia } from "@/lib/wasender";
import { createServiceClient } from "@/lib/supabase";

const mockDownload = vi.mocked(downloadMedia);
const mockCreateClient = vi.mocked(createServiceClient);

describe("processMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("downloads media and uploads to Supabase Storage", async () => {
    const testBuffer = Buffer.from("fake-image-data");

    mockDownload.mockResolvedValueOnce({
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

    const url = await processMedia("msg-123", "proj-1", "progress");

    expect(mockDownload).toHaveBeenCalledWith("msg-123");
    expect(mockUpload).toHaveBeenCalledOnce();
    expect(url).toContain("site-photos");

    // Verify the upload path includes project ID and category
    const uploadPath = mockUpload.mock.calls[0][0];
    expect(uploadPath).toContain("proj-1");
    expect(uploadPath).toContain("progress");
    expect(uploadPath).toMatch(/\.jpg$/);
  });

  it("throws when upload fails", async () => {
    mockDownload.mockResolvedValueOnce({
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

    await expect(processMedia("msg-123", "proj-1")).rejects.toThrow(
      "Storage upload failed: Bucket not found"
    );
  });

  it("uses correct file extension for different content types", async () => {
    const contentTypes = [
      { type: "image/jpeg", ext: "jpg" },
      { type: "image/png", ext: "png" },
      { type: "image/webp", ext: "webp" },
      { type: "audio/ogg", ext: "ogg" },
      { type: "application/pdf", ext: "pdf" },
    ];

    for (const { type, ext } of contentTypes) {
      vi.clearAllMocks();

      mockDownload.mockResolvedValueOnce({
        buffer: Buffer.from("data"),
        contentType: type,
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

      await processMedia("msg-123", "proj-1");

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

  it("downloads audio and sends to Groq Whisper", async () => {
    mockDownload.mockResolvedValueOnce({
      buffer: Buffer.from("fake-audio"),
      contentType: "audio/ogg",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: "Hoy compramos 50 blocks de cemento" }),
    });

    const result = await transcribeVoiceNote("msg-voice");

    expect(result).toBe("Hoy compramos 50 blocks de cemento");
    expect(mockDownload).toHaveBeenCalledWith("msg-voice");
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/audio/transcriptions");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toContain("gsk_");
  });

  it("throws when Groq API fails", async () => {
    mockDownload.mockResolvedValueOnce({
      buffer: Buffer.from("audio"),
      contentType: "audio/ogg",
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limited",
    });

    await expect(transcribeVoiceNote("msg-voice")).rejects.toThrow(
      "Groq transcription failed: 429"
    );
  });

  it("throws when GROQ_API_KEY is missing", async () => {
    const original = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    await expect(transcribeVoiceNote("msg-voice")).rejects.toThrow(
      "Missing GROQ_API_KEY"
    );

    process.env.GROQ_API_KEY = original;
  });
});
