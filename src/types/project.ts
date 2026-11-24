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
  liveUrl: string;
  demoUrl: string;
  repoUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt">;
