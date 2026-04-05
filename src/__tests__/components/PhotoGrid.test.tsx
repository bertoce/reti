import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PhotoGrid from "@/components/PhotoGrid";
import { type SitePhoto } from "@/lib/supabase";

function makePhoto(overrides: Partial<SitePhoto> = {}): SitePhoto {
  return {
    id: "photo-" + Math.random().toString(36).slice(2),
    project_id: "proj-1",
    task_id: null,
    file_url: "https://example.com/photo.jpg",
    thumbnail_url: null,
    caption: null,
    category: "progress",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("PhotoGrid", () => {
  const samplePhotos: SitePhoto[] = [
    makePhoto({ id: "p1", file_url: "https://example.com/1.jpg", caption: "Avance losa" }),
    makePhoto({ id: "p2", file_url: "https://example.com/2.jpg" }),
    makePhoto({ id: "p3", file_url: "https://example.com/3.jpg", caption: "Recibo" }),
  ];

  it("renders photo thumbnails", () => {
    render(<PhotoGrid photos={samplePhotos} />);
    expect(screen.getAllByTestId("photo-thumbnail")).toHaveLength(3);
  });

  it("shows empty state when no photos", () => {
    render(<PhotoGrid photos={[]} />);
    expect(screen.getByTestId("empty-photos")).toBeInTheDocument();
  });

  it("opens lightbox when a thumbnail is clicked", () => {
    render(<PhotoGrid photos={samplePhotos} />);

    fireEvent.click(screen.getAllByTestId("photo-thumbnail")[0]);
    expect(screen.getByTestId("photo-lightbox")).toBeInTheDocument();
  });

  it("shows caption in lightbox", () => {
    render(<PhotoGrid photos={samplePhotos} />);

    fireEvent.click(screen.getAllByTestId("photo-thumbnail")[0]);
    expect(screen.getByText("Avance losa")).toBeInTheDocument();
  });

  it("closes lightbox when clicking the backdrop", () => {
    render(<PhotoGrid photos={samplePhotos} />);

    // Open
    fireEvent.click(screen.getAllByTestId("photo-thumbnail")[0]);
    expect(screen.getByTestId("photo-lightbox")).toBeInTheDocument();

    // Close
    fireEvent.click(screen.getByTestId("photo-lightbox"));
    expect(screen.queryByTestId("photo-lightbox")).not.toBeInTheDocument();
  });

  it("uses thumbnail_url when available", () => {
    const photosWithThumbs = [
      makePhoto({ id: "p1", file_url: "https://example.com/full.jpg", thumbnail_url: "https://example.com/thumb.jpg" }),
    ];
    render(<PhotoGrid photos={photosWithThumbs} />);

    const img = screen.getAllByTestId("photo-thumbnail")[0].querySelector("img");
    expect(img?.src).toContain("thumb.jpg");
  });
});
