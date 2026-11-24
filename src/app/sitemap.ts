import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getProjects } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = ["", "/about", "/experience", "/projects", "/contact"].map((route) => ({ url: `${site.url}${route}`, lastModified: now, changeFrequency: "monthly" as const, priority: route === "" ? 1 : 0.7 }));
  const projectRoutes = (await getProjects()).map((project) => ({ url: `${site.url}/projects/${project.slug}`, lastModified: new Date(project.updatedAt), changeFrequency: "monthly" as const, priority: 0.6 }));
  return [...routes, ...projectRoutes];
}
