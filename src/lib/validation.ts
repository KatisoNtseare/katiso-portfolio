import { z } from "zod";

const optionalUrl = z.string().trim().max(1000).refine((value) => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; }
  catch { return false; }
}, "Enter a valid http or https URL.");

export const projectSchema = z.object({
  title: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(110).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens."),
  summary: z.string().trim().min(10).max(240),
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
  liveUrl: optionalUrl.default(""),
  demoUrl: optionalUrl.default(""),
  repoUrl: optionalUrl.default(""),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(10000).default(0),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  organisation: z.string().trim().max(120).default(""),
  enquiryType: z.enum(["Employment opportunity", "Software development", "Partnership", "General enquiry"]),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(20).max(5000),
  website: z.string().max(0).optional().default(""),
});
