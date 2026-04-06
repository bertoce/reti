"use client";

import { useState } from "react";
import { type SitePhoto } from "@/lib/supabase";
import { formatDate, formatTime } from "@/lib/format";

type Props = {
  photos: SitePhoto[];
};

export default function PhotoGrid({ photos }: Props) {
  const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-16 px-6" data-testid="empty-photos">
        <p className="text-sm text-muted">No hay fotos</p>
      </div>
    );
  }

  return (
    <div data-testid="photo-grid">
      <div className="px-6 py-4">
        <p className="section-label mb-4">
          {photos.length} foto{photos.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-0.5 px-0.5 pb-6">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="aspect-square overflow-hidden bg-subtle transition-opacity hover:opacity-90"
            data-testid="photo-thumbnail"
          >
            <img
              src={photo.thumbnail_url || photo.file_url}
              alt={photo.caption || ""}
              className="w-full h-full object-cover photo-warm"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-foreground/95 flex flex-col"
          onClick={() => setSelectedPhoto(null)}
          data-testid="photo-lightbox"
        >
          {/* Close */}
          <div className="flex justify-end p-4">
            <button className="text-white/50 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center px-6 pb-4">
            <img
              src={selectedPhoto.file_url}
              alt={selectedPhoto.caption || ""}
              className="max-w-full max-h-full object-contain rounded"
            />
          </div>

          {/* Caption */}
          {(selectedPhoto.caption || selectedPhoto.created_at) && (
            <div className="px-6 pb-8 text-center" onClick={(e) => e.stopPropagation()}>
              {selectedPhoto.caption && (
                <p className="text-white text-sm mb-1 leading-relaxed">{selectedPhoto.caption}</p>
              )}
              <p className="text-white/40 text-xs">
                {formatDate(selectedPhoto.created_at)} — {formatTime(selectedPhoto.created_at)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
