import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import type { Project } from "@/types/project";

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const visualStyle = project.coverImage
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(18,18,18,.05) 0%, rgba(18,18,18,.1) 45%, rgba(18,18,18,.52) 100%), url("${project.coverImage}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <Link href={`/projects/${project.slug}`} className={`project-card project-card-${(index % 4) + 1} ${project.coverImage ? "has-cover" : "has-placeholder"}`}>
      <div className="project-visual" style={visualStyle} role={project.coverImage ? "img" : undefined} aria-label={project.coverImage ? `${project.title} project cover` : undefined}>
        <div className="project-visual-top"><span>{project.category}</span><span>{project.year || "CASE STUDY"}</span></div>
        {!project.coverImage ? (
          <div className="project-window" aria-hidden="true">
            <div className="window-dots"><i /><i /><i /></div>
            <div className="window-lines"><b /><b /><b /><b /></div>
            <div className="window-blocks"><i /><i /><i /></div>
          </div>
        ) : null}
        <div className="project-visual-mark"><Layers3 size={34} strokeWidth={1.2} /></div>
        <span className="project-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="project-visual-cta">VIEW CASE STUDY <ArrowUpRight size={13} /></span>
      </div>
      <div className="project-card-content">
        <div><h3>{project.title}</h3><p>{project.summary}</p></div>
        <ArrowUpRight className="project-arrow" size={21} />
      </div>
      <div className="project-card-footer"><div className="tag-list">{project.technologies.slice(0, 4).map((tech) => <span key={tech}>{tech}</span>)}</div><span className="project-card-kind">CASE STUDY</span></div>
    </Link>
  );
}
