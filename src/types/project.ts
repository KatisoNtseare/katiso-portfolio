export type ProjectImage = {
  secureUrl: string;
  publicId: string;
  altText?: string;
  width?: number;
  height?: number;
  format?: string;
};

export type ProjectImageMedia = {
  id: string;
  type: "image";
  secureUrl: string;
  publicId: string;
  altText: string;
  width?: number;
  height?: number;
  format?: string;
  displayOrder: number;
  isPrimary: boolean;
};

export type ProjectVideoMedia = {
  id: string;
  type: "video";
  provider: "google-drive";
  fileId: string;
  originalUrl: string;
  embedUrl: string;
  title: string;
  description?: string;
  displayOrder: number;
};

export type ProjectMedia = ProjectImageMedia | ProjectVideoMedia;

export type Project = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  year: string;
  role: string;
  problem: string;
  solution: string;
  contributions: string;
  architecture: string;
  architectureFlow: string[];
  challenges: string;
  outcomes: string;
  technologies: string[];
  coverImage: string;
  image?: ProjectImage;
  altText?: string;
  media: ProjectMedia[];
  liveUrl: string;
  demoUrl: string;
  repoUrl: string;
  isFeatured: boolean;
  isInDevelopment: boolean;
  isPublished: boolean;
  publishedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt">;
