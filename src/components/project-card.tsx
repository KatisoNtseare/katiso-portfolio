import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/types/project";

export function ProjectCard({ project }: { project: Project; index?: number }) {
  const imageUrl = project.coverImage || project.image?.secureUrl;
  const altText = project.altText || project.image?.altText || `${project.title} project cover`;
  const isOptimizableSource = Boolean(imageUrl && (imageUrl.startsWith("/") || (() => {
    try { return new URL(imageUrl).hostname === "res.cloudinary.com"; } catch { return false; }
  })()));
  const visualStyle = imageUrl && !isOptimizableSource ? { backgroundImage: `url("${imageUrl}")` } : undefined;
  const technologies = (project.technologies || []).slice(0, 5);

  return (
    <Link href={`/projects/${project.slug}`} className="k-work" data-reveal>
      <div className="k-work-media" style={visualStyle} role={imageUrl ? "img" : undefined} aria-label={imageUrl ? altText : undefined}>
        {imageUrl && isOptimizableSource ? <Image src={imageUrl} alt="" fill sizes="(max-width: 700px) 92vw, (max-width: 1100px) 50vw, 380px" /> : null}
        {!imageUrl ? <span className="k-work-fallback" aria-hidden="true">{project.title.charAt(0)}</span> : null}
      </div>
      <div>
        <p className="k-work-meta"><span>{project.category}</span>{project.year ? <span>{project.year}</span> : null}</p>
        <h3>{project.title}</h3>
        <p className="k-work-summary">{project.summary}</p>
        {technologies.length ? <ul className="k-work-tags" aria-label="Technologies">{technologies.map((technology) => <li key={technology}>{technology}</li>)}</ul> : null}
      </div>
    </Link>
  );
}