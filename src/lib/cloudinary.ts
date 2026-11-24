import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import type { ProjectImage } from "@/types/project";

export const CLOUDINARY_PROJECT_FOLDER = "katiso-portfolio/project-pictures";
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const PROJECT_PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;

export function isProjectImagePublicId(publicId: unknown): publicId is string {
  if (typeof publicId !== "string" || !publicId || publicId !== publicId.trim()) return false;
  if (!PROJECT_PUBLIC_ID_PATTERN.test(publicId)) return false;
  const segments = publicId.split("/");
  const folder = CLOUDINARY_PROJECT_FOLDER.split("/");
  return segments.length > folder.length && folder.every((part, index) => segments[index] === part);
}

export type DetectedImageType = {
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
};

export function detectImageType(buffer: Buffer): DetectedImageType | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  // WebP: RIFF (bytes 0-3) ... WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}

export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  return Boolean(cloudName && apiKey && apiSecret);
}

export function getCloudinaryClient() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are not configured. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

export async function uploadProjectImageToCloudinary(
  buffer: Buffer,
  options?: { altText?: string; publicIdSuffix?: string },
  clientOverride?: typeof cloudinary
): Promise<ProjectImage> {
  const client = clientOverride || getCloudinaryClient();

  if (!buffer || buffer.length === 0) {
    throw new Error("Cannot upload an empty file.");
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image file exceeds the 5 MB limit.");
  }

  const detected = detectImageType(buffer);
  if (!detected) {
    throw new Error("Unsupported image format. Please upload a JPEG, PNG, or WebP image.");
  }

  return new Promise<ProjectImage>((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder: CLOUDINARY_PROJECT_FOLDER,
        resource_type: "image",
        transformation: [
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error: unknown, result?: UploadApiResponse) => {
        if (error || !result) {
          const message = typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : "Cloudinary upload failed.";
          return reject(new Error(message));
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          altText: options?.altText || "",
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteProjectImageFromCloudinary(publicId: string, clientOverride?: typeof cloudinary): Promise<boolean> {
  if (!isProjectImagePublicId(publicId)) {
    console.warn("Refusing to delete an invalid or out-of-folder Cloudinary asset.");
    return false;
  }

  try {
    const client = clientOverride || getCloudinaryClient();
    const result = await client.uploader.destroy(publicId, { invalidate: true });
    // Cloudinary returns { result: 'ok' } or { result: 'not found' }
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, error);
    return false;
  }
}

export async function cleanupUploadedImage(publicId?: string): Promise<void> {
  if (!publicId) return;
  try {
    await deleteProjectImageFromCloudinary(publicId);
  } catch (error) {
    console.error(`Failed to cleanup uploaded image ${publicId}:`, error);
  }
}
