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
      <p className="text-center text-sm text-muted py-8 px-4" data-testid="empty-photos">
        No hay fotos
      </p>
    );
  }

  return (
    <div data-testid="photo-grid">
      <div className="grid grid-cols-3 gap-1 px-1 pb-4">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="aspect-square overflow-hidden bg-gray-100"
            data-testid="photo-thumbnail"
          >
            <img
              src={photo.thumbnail_url || photo.file_url}
              alt={photo.caption || ""}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setSelectedPhoto(null)}
          data-testid="photo-lightbox"
        >
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={selectedPhoto.file_url}
              alt={selectedPhoto.caption || ""}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
          {(selectedPhoto.caption || selectedPhoto.created_at) && (
            <div className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
              {selectedPhoto.caption && (
                <p className="text-white text-sm mb-1">{selectedPhoto.caption}</p>
              )}
              <p className="text-white/50 text-xs">
                {formatDate(selectedPhoto.created_at)} — {formatTime(selectedPhoto.created_at)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
