import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, ExternalLink, Github, Layers3, UserRound } from "lucide-react";
import { getProjectBySlug } from "@/lib/db";
import { ArchitectureFlow } from "@/components/architecture-flow";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const project = await getProjectBySlug(slug);
  return project ? { title: project.title, description: project.summary } : { title: "Project not found" };
}
export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params; const project = await getProjectBySlug(slug);
  if (!project) notFound();
  const sections = [
    ["Overview", project.description], ["The problem", project.problem], ["The solution", project.solution],
    ["My contributions", project.contributions], ["Architecture & engineering", project.architecture],
    ["Challenges & decisions", project.challenges], ["Outcomes & lessons", project.outcomes],
  ].filter((item) => Boolean(item[1]));
  const coverStyle = project.coverImage
    ? { backgroundImage: `linear-gradient(180deg, rgba(18,18,18,.06), rgba(18,18,18,.35)), url("${project.coverImage}")` }
    : undefined;

  return (
    <main>
      <section className="project-detail-hero">
        <div className="shell">
          <Link className="text-link" href="/projects"><ArrowLeft size={15} /> Back to projects</Link>
          <div className="project-detail-hero-grid">
            <div className="project-detail-heading">
              <span className="eyebrow">{project.category}</span>
              <h1>{project.title}</h1>
              <p>{project.summary}</p>
              <div className="detail-meta"><span><CalendarDays size={14} /> {project.year || "Project"}</span><span><UserRound size={14} /> {project.role || "Software development"}</span></div>
            </div>
            <div className={`project-detail-visual ${project.coverImage ? "has-cover" : "has-placeholder"}`} style={coverStyle} role={project.coverImage ? "img" : undefined} aria-label={project.coverImage ? `${project.title} project cover` : undefined}>
              <span className="detail-visual-label">PROJECT SNAPSHOT</span>
              <span className="detail-visual-mark"><Layers3 size={44} strokeWidth={1.1} /></span>
              <span className="detail-visual-footer">{project.category.toUpperCase()} · {project.year || "CASE STUDY"}</span>
            </div>
          </div>
        </div>
      </section>
      <section className="shell detail-layout">
        <div className="detail-content">
          {sections.length ? sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>) : <div className="empty-public">This case study is being expanded. More project details will be added soon.</div>}
          {project.architectureFlow.length > 1 ? <section><h2>System flow</h2><ArchitectureFlow nodes={project.architectureFlow} /></section> : null}
        </div>
        <aside className="detail-sidebar">
          <h3>Technologies</h3>
          <div className="tag-list">{project.technologies.map((tech) => <span key={tech}>{tech}</span>)}</div>
          <h3>Project links</h3>
          <div className="detail-links">
            {project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noreferrer">Live application <ExternalLink size={14} /></a> : null}
            {project.demoUrl ? <a href={project.demoUrl} target="_blank" rel="noreferrer">Demonstration <ArrowUpRight size={14} /></a> : null}
            {project.repoUrl ? <a href={project.repoUrl} target="_blank" rel="noreferrer">Source repository <Github size={14} /></a> : null}
            {!project.liveUrl && !project.demoUrl && !project.repoUrl ? <span className="detail-no-links">Links will be added when available.</span> : null}
          </div>
        </aside>
      </section>
    </main>
  );
}
