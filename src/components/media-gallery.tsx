"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Film, Image as ImageIcon, Maximize2, Video, X } from "lucide-react";
import type { ProjectImageMedia, ProjectMedia, ProjectVideoMedia } from "@/types/project";
import { buildGoogleDriveEmbedUrl, isValidGoogleDriveFileId, sortProjectMedia } from "@/lib/media";

type Props = {
  media: ProjectMedia[];
  projectTitle: string;
};

function isNextImageSource(src: string): boolean {
  if (src.startsWith("/")) return true;
  try { return new URL(src).hostname === "res.cloudinary.com"; } catch { return false; }
}

export function MediaGallery({ media, projectTitle }: Props) {
  const [activeFilter, setActiveFilter] = useState<"all" | "images" | "videos">("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const sortedMedia = useMemo(() => {
    return sortProjectMedia(media || []).filter((item) => item.type === "image" || isValidGoogleDriveFileId(item.fileId));
  }, [media]);

  const images = useMemo(() => {
    return sortedMedia.filter((item): item is ProjectImageMedia => item.type === "image");
  }, [sortedMedia]);

  const videos = useMemo(() => {
    return sortedMedia.filter((item): item is ProjectVideoMedia => item.type === "video");
  }, [sortedMedia]);

  const displayedMedia = useMemo(() => {
    if (activeFilter === "images") return images;
    if (activeFilter === "videos") return videos;
    return sortedMedia;
  }, [activeFilter, images, sortedMedia, videos]);

  // Open lightbox pointing to a specific image
  function openLightbox(imageItem: ProjectImageMedia) {
    const idx = images.findIndex((img) => img.id === imageItem.id);
    if (idx !== -1) {
      setLightboxIndex(idx);
    }
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((current) => current === null || images.length === 0 ? current : (current + 1) % images.length);
      if (e.key === "ArrowLeft") setLightboxIndex((current) => current === null || images.length === 0 ? current : (current - 1 + images.length) % images.length);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, images.length]);

  if (!sortedMedia || sortedMedia.length === 0) {
    return null;
  }

  const activeImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  return (
    <section className="media-gallery-section" aria-label="Project media gallery">
      <div className="media-gallery-header">
        <div>
          <span className="eyebrow">VISUAL SHOWCASE</span>
          <h2>Media gallery & demonstrations</h2>
          <p className="media-gallery-intro">
            High-resolution screenshots, architectural diagrams and embedded video demonstrations for {projectTitle}.
          </p>
        </div>

        {images.length > 0 && videos.length > 0 ? (
          <div className="media-filter-pills" role="group" aria-label="Filter project media">
            <button
              type="button"
              aria-pressed={activeFilter === "all"}
              className={`media-filter-btn ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All media ({sortedMedia.length})
            </button>
            <button
              type="button"
              aria-pressed={activeFilter === "images"}
              className={`media-filter-btn ${activeFilter === "images" ? "active" : ""}`}
              onClick={() => setActiveFilter("images")}
            >
              <ImageIcon size={14} /> Images ({images.length})
            </button>
            <button
              type="button"
              aria-pressed={activeFilter === "videos"}
              className={`media-filter-btn ${activeFilter === "videos" ? "active" : ""}`}
              onClick={() => setActiveFilter("videos")}
            >
              <Video size={14} /> Videos ({videos.length})
            </button>
          </div>
        ) : null}
      </div>

      <div className="media-gallery-grid">
        {displayedMedia.map((item) => {
          if (item.type === "image") {
            return (
              <figure key={item.id} className="media-card media-card-image">
                <button
                  type="button"
                  className="media-card-thumb-wrap"
                  onClick={() => openLightbox(item)}
                  aria-label={`View image: ${item.altText || projectTitle}`}
                >
                  {isNextImageSource(item.secureUrl)
                    ? <Image src={item.secureUrl} alt={item.altText || `${projectTitle} preview`} fill sizes="(max-width: 700px) 90vw, 45vw" loading="lazy" className="media-card-img" />
                    : <span className="media-card-img-fallback" role="img" aria-label={item.altText || `${projectTitle} preview`} style={{ backgroundImage: `url("${item.secureUrl}")` }} />}
                  <div className="media-card-hover-overlay">
                    <span className="media-card-zoom-badge">
                      <Maximize2 size={16} /> View image
                    </span>
                  </div>
                  {item.isPrimary ? <span className="media-primary-badge">Cover image</span> : null}
                </button>
                {item.altText ? (
                  <figcaption className="media-card-caption">
                    <span>{item.altText}</span>
                  </figcaption>
                ) : null}
              </figure>
            );
          }

          if (item.type === "video") {
            return (
              <div key={item.id} className="media-card media-card-video">
                <div className="media-video-aspect-wrap">
                  <iframe
                    src={buildGoogleDriveEmbedUrl(item.fileId)}
                    title={item.title || `${projectTitle} demonstration`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="media-video-iframe"
                  />
                </div>
                <div className="media-video-info">
                  <div className="media-video-heading">
                    <span className="media-video-badge">
                      <Film size={13} /> Google Drive Video
                    </span>
                    <h4>{item.title}</h4>
                  </div>
                  {item.description ? <p className="media-video-desc">{item.description}</p> : null}
                  <small className="media-video-note">
                    Note: If video playback is restricted, verify that you are signed in or that link sharing is enabled.
                  </small>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && activeImage ? (
        <div
          className="media-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={closeLightbox}
        >
          <div className="media-lightbox-container" onClick={(e) => e.stopPropagation()}>
            <div className="media-lightbox-topbar">
              <span className="media-lightbox-counter">
                Image {lightboxIndex + 1} of {images.length}
              </span>
              <button
                type="button"
                className="media-lightbox-close"
                onClick={closeLightbox}
                aria-label="Close image viewer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="media-lightbox-main">
              {images.length > 1 ? (
                <button
                  type="button"
                  className="media-lightbox-nav prev"
                  onClick={() => setLightboxIndex((current) => current === null || images.length === 0 ? current : (current - 1 + images.length) % images.length)}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={28} />
                </button>
              ) : null}

              <div className="media-lightbox-view">
                {isNextImageSource(activeImage.secureUrl)
                  ? <Image src={activeImage.secureUrl} alt={activeImage.altText || `${projectTitle} image ${lightboxIndex + 1}`} fill sizes="95vw" priority className="media-lightbox-image" />
                  : <span className="media-lightbox-fallback" role="img" aria-label={activeImage.altText || `${projectTitle} image ${lightboxIndex + 1}`} style={{ backgroundImage: `url("${activeImage.secureUrl}")` }} />}
              </div>

              {images.length > 1 ? (
                <button
                  type="button"
                  className="media-lightbox-nav next"
                  onClick={() => setLightboxIndex((current) => current === null || images.length === 0 ? current : (current + 1) % images.length)}
                  aria-label="Next image"
                >
                  <ChevronRight size={28} />
                </button>
              ) : null}
            </div>

            {activeImage.altText ? (
              <div className="media-lightbox-caption">
                <p>{activeImage.altText}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
