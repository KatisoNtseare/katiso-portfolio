import { z } from "zod";
import { extractGoogleDriveFileId, buildGoogleDriveEmbedUrl, MAX_PROJECT_IMAGES, MAX_PROJECT_VIDEOS } from "./media.ts";

const optionalUrl = z.string().trim().max(1000).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}, "Enter a valid http or https URL.");

export const projectImageSchema = z.object({
  secureUrl: z.string().url("A valid secure image URL is required."),
  publicId: z.string().trim().min(1, "A Cloudinary public ID is required."),
  altText: z.string().trim().max(300).default(""),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().max(20).optional(),
});

export const projectImageMediaSchema = z.object({
  id: z.string().trim().min(1, "Media ID is required."),
  type: z.literal("image"),
  secureUrl: z.string().url("A valid secure image URL is required."),
  publicId: z.string().trim().min(1, "A Cloudinary public ID is required."),
  altText: z.string().trim().max(300).default(""),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().max(20).optional(),
  displayOrder: z.number().int().min(0).max(10000).default(0),
  isPrimary: z.boolean().default(false),
});

export const projectVideoMediaSchema = z.object({
  id: z.string().trim().min(1, "Media ID is required."),
  type: z.literal("video"),
  provider: z.literal("google-drive"),
  fileId: z.string().trim().min(15, "A valid Google Drive file ID is required."),
  originalUrl: z.string().url("A valid Google Drive URL is required."),
  // Accepted for old clients, but always discarded and regenerated below.
  embedUrl: z.string().max(1000).optional(),
  isPrimary: z.boolean().optional().refine((value) => value !== true, "Videos cannot be primary images."),
  title: z.string().trim().min(1, "Video title is required.").max(200),
  description: z.string().trim().max(2000).optional().default(""),
  displayOrder: z.number().int().min(0).max(10000).default(0),
}).superRefine((data, ctx) => {
  const extracted = extractGoogleDriveFileId(data.originalUrl);
  if (!extracted || extracted !== data.fileId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Video URL must be a supported Google Drive sharing link matching its file ID.", path: ["originalUrl"] });
  }
}).transform((data) => {
  const { embedUrl, isPrimary, ...safeData } = data;
  void embedUrl;
  void isPrimary;
  return { ...safeData, embedUrl: buildGoogleDriveEmbedUrl(data.fileId) };
});

export const projectMediaSchema = z.discriminatedUnion("type", [
  projectImageMediaSchema,
  projectVideoMediaSchema,
]);

export const googleDriveVideoInputSchema = z.object({
  url: z.string().trim().min(1, "Google Drive URL is required.").refine((val) => {
    return extractGoogleDriveFileId(val) !== null;
  }, "Please provide a valid Google Drive file sharing link (e.g. https://drive.google.com/file/d/FILE_ID/view?usp=sharing)."),
  title: z.string().trim().min(1, "Video title is required.").max(200),
  description: z.string().trim().max(2000).optional().default(""),
  displayOrder: z.number().int().min(0).max(10000).default(0),
}).transform((data) => {
  const fileId = extractGoogleDriveFileId(data.url)!;
  return {
    type: "video" as const,
    provider: "google-drive" as const,
    fileId,
    originalUrl: data.url,
    embedUrl: buildGoogleDriveEmbedUrl(fileId),
    title: data.title,
    description: data.description || "",
    displayOrder: data.displayOrder,
  };
});

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(100),
  slug: z.string().trim().min(2, "Slug must be at least 2 characters.").max(110).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens."),
  summary: z.string().trim().min(10, "Summary must be at least 10 characters.").max(240),
  description: z.string().max(10000).default(""),
  category: z.string().trim().max(80).default("Software Development"),
  year: z.string().trim().max(20).default(""),
  role: z.string().trim().max(120).default(""),
  problem: z.string().max(5000).default(""),
  solution: z.string().max(5000).default(""),
  contributions: z.string().max(5000).default(""),
  architecture: z.string().max(5000).default(""),
  architectureFlow: z.array(z.string().trim().min(1).max(80)).max(8).default([]),
  challenges: z.string().max(5000).default(""),
  outcomes: z.string().max(5000).default(""),
  technologies: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  coverImage: optionalUrl.default(""),
  image: projectImageSchema.optional(),
  altText: z.string().trim().max(300).default(""),
  media: z.array(projectMediaSchema).default([]),
  liveUrl: optionalUrl.default(""),
  demoUrl: optionalUrl.default(""),
  repoUrl: optionalUrl.default(""),
  isFeatured: z.boolean().default(false),
  isInDevelopment: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  // Older project records may carry a null publication timestamp. Treat it as
  // unset; the API assigns the timestamp when publishing.
  publishedAt: z.string().nullish().transform((value) => value ?? undefined),
  sortOrder: z.number().int().min(0).max(10000).default(0),
}).superRefine((data, ctx) => {
  const images = (data.media || []).filter((item) => item.type === "image");
  const videos = (data.media || []).filter((item) => item.type === "video");

  if (images.length > MAX_PROJECT_IMAGES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `A project cannot have more than ${MAX_PROJECT_IMAGES} images (received ${images.length}).`,
      path: ["media"],
    });
  }

  if (videos.length > MAX_PROJECT_VIDEOS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `A project cannot have more than ${MAX_PROJECT_VIDEOS} videos (received ${videos.length}).`,
      path: ["media"],
    });
  }

  const primaryImages = images.filter((img) => img.isPrimary);

  if (primaryImages.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A project cannot have more than one primary image.",
      path: ["media"],
    });
  }

  if (data.isPublished && images.length > 0 && primaryImages.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Published projects with uploaded images must have exactly one primary image selected.",
      path: ["media"],
    });
  }
});

export const projectCreateSchema = projectSchema;

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(200),
  organisation: z.string().trim().max(120).default(""),
  enquiryType: z.enum(["Employment opportunity", "Software development", "Partnership", "General enquiry"]),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(20).max(5000),
  website: z.string().max(0).optional().default(""),
});
