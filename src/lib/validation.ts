import { z } from "zod";

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
  liveUrl: optionalUrl.default(""),
  demoUrl: optionalUrl.default(""),
  repoUrl: optionalUrl.default(""),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().optional(),
  sortOrder: z.number().int().min(0).max(10000).default(0),
}).superRefine((data, ctx) => {
  // If published, a valid cover image is strictly required
  const hasCoverImage = Boolean(data.coverImage?.trim()) || Boolean(data.image?.secureUrl?.trim());
  if (data.isPublished && !hasCoverImage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A valid cover image is required before publishing a project.",
      path: ["coverImage"],
    });
  }
});

export const projectCreateSchema = projectSchema.superRefine((data, ctx) => {
  // A new project cannot be created without a cover image
  const hasCoverImage = Boolean(data.coverImage?.trim()) || Boolean(data.image?.secureUrl?.trim());
  if (!hasCoverImage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A cover image is required to create a project.",
      path: ["coverImage"],
    });
  }
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(200),
  organisation: z.string().trim().max(120).default(""),
  enquiryType: z.enum(["Employment opportunity", "Software development", "Partnership", "General enquiry"]),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(20).max(5000),
  website: z.string().max(0).optional().default(""),
});
