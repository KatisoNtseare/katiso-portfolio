import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/types/project";

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const imageUrl = project.coverImage || project.image?.secureUrl;
  const altText = project.altText || project.image?.altText || `${project.title} project cover`;
  const isOptimizableSource = Boolean(imageUrl && (imageUrl.startsWith("/") || (() => {
    try { return new URL(imageUrl).hostname === "res.cloudinary.com"; } catch { return false; }
  })()));
  const visualStyle = imageUrl && !isOptimizableSource ? { backgroundImage: `url("${imageUrl}")` } : undefined;

  return (
    <Link href={`/projects/${project.slug}`} className="work-card" data-gsap-reveal>
      <div className="work-visual" style={visualStyle} role={imageUrl ? "img" : undefined} aria-label={imageUrl ? altText : undefined}>
        {imageUrl && isOptimizableSource ? <Image src={imageUrl} alt="" fill sizes={index === 0 ? "(max-width: 700px) 90vw, 100vw" : "(max-width: 700px) 90vw, 50vw"} className="work-image" /> : null}
        {!imageUrl ? <div className="work-visual-placeholder" aria-hidden="true"><span>Project imagery unavailable</span></div> : null}
      </div>
      <div className="work-copy">
        <div>
          <p className="work-meta">{project.category}{project.year ? <><span aria-hidden="true">·</span><span className="folio-mono">{project.year}</span></> : null}</p>
          <h3>{project.title}</h3>
          <p>{project.summary}</p>
          <div className="work-tags" aria-label="Technologies">
            {(project.technologies || []).slice(0, 5).map((technology) => <span className="folio-tag" key={technology}>{technology}</span>)}
          </div>
        </div>
        <ArrowUpRight className="work-card-arrow" size={20} aria-hidden="true" />
      </div>
    </Link>
  );
}
