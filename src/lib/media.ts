import type { ProjectImageMedia, ProjectMedia } from "@/types/project";

const GOOGLE_DRIVE_FILE_ID_REGEX = /^[a-zA-Z0-9_-]{15,60}$/;

export const MAX_PROJECT_IMAGES = 20;
export const MAX_PROJECT_VIDEOS = 5;

/**
 * Extracts the Google Drive file ID from standard sharing or direct links.
 * Returns null if the URL is not a recognized Google Drive file link.
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (GOOGLE_DRIVE_FILE_ID_REGEX.test(trimmed)) return trimmed;
  let parsed: URL;
  try { parsed = new URL(trimmed); } catch { return null; }
  if (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== "drive.google.com" || parsed.port) return null;
  const pathMatch = parsed.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]{15,60})(?:\/|$)/);
  const queryId = ["open", "uc"].includes(parsed.pathname.replace(/^\//, "")) ? parsed.searchParams.get("id") : null;
  const id = pathMatch?.[1] || queryId;
  return id && GOOGLE_DRIVE_FILE_ID_REGEX.test(id) ? id : null;
}

export function isValidGoogleDriveFileId(fileId: string): boolean {
  return GOOGLE_DRIVE_FILE_ID_REGEX.test(fileId);
}

/**
 * Generates the standard embed preview URL for a Google Drive file.
 */
export function buildGoogleDriveEmbedUrl(fileId: string): string {
  const cleanId = fileId.trim();
  if (!isValidGoogleDriveFileId(cleanId)) throw new Error("Invalid Google Drive file ID.");
  return `https://drive.google.com/file/d/${cleanId}/preview`;
}

/**
 * Sorts project media by displayOrder ascending, fallback to original order.
 */
export function sortProjectMedia<T extends { displayOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

/**
 * Ensures display orders are clean integers 1..N
 */
export function normalizeMediaOrder(media: ProjectMedia[]): ProjectMedia[] {
  return media.map((item, index) => ({
    ...item,
    displayOrder: index + 1,
  }));
}

/**
 * Finds the primary image in a project's media collection.
 */
export function getPrimaryImage(media?: ProjectMedia[]): ProjectImageMedia | null {
  if (!media || media.length === 0) return null;
  const images = media.filter((m): m is ProjectImageMedia => m.type === "image");
  if (images.length === 0) return null;
  return images.find((img) => img.isPrimary) || images[0] || null;
}
