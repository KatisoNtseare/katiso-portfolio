import type { ProjectImageMedia, ProjectMedia } from "@/types/project";
import { MAX_PROJECT_IMAGES, MAX_PROJECT_VIDEOS, normalizeMediaOrder } from "./media.ts";

export function addProjectMedia(media: ProjectMedia[], item: ProjectMedia): ProjectMedia[] {
  const images = media.filter((entry) => entry.type === "image").length;
  const videos = media.length - images;
  if (item.type === "image" && images >= MAX_PROJECT_IMAGES) throw new Error(`A project cannot have more than ${MAX_PROJECT_IMAGES} images.`);
  if (item.type === "video" && videos >= MAX_PROJECT_VIDEOS) throw new Error(`A project cannot have more than ${MAX_PROJECT_VIDEOS} videos.`);
  const next = item.type === "image" && images === 0
    ? [...media, { ...item, isPrimary: true }]
    : [...media, item];
  return normalizeMediaOrder(next);
}

export function setPrimaryProjectImage(media: ProjectMedia[], mediaId: string): ProjectMedia[] {
  return media.map((item) => item.type === "image" ? { ...item, isPrimary: item.id === mediaId } : item);
}

export function removeProjectMedia(media: ProjectMedia[], mediaId: string): ProjectMedia[] {
  const removed = media.find((item) => item.id === mediaId);
  let remaining = media.filter((item) => item.id !== mediaId);
  if (removed?.type === "image" && removed.isPrimary) {
    const nextPrimaryId = remaining.find((item): item is ProjectImageMedia => item.type === "image")?.id;
    if (nextPrimaryId) remaining = setPrimaryProjectImage(remaining, nextPrimaryId);
  }
  return normalizeMediaOrder(remaining);
}

export function reorderProjectMedia(media: ProjectMedia[], index: number, direction: "up" | "down"): ProjectMedia[] {
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || index >= media.length || target < 0 || target >= media.length) return media;
  const reordered = [...media];
  const [item] = reordered.splice(index, 1);
  reordered.splice(target, 0, item);
  return normalizeMediaOrder(reordered);
}
