import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, ExternalLink, Github, Layers3, UserRound } from "lucide-react";
import { getProjectBySlug } from "@/lib/db";
import { ArchitectureFlow } from "@/components/architecture-flow";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return project
    ? {
        title: `${project.title} | Case Study`,
        description: project.summary,
        openGraph: {
          title: project.title,
          description: project.summary,
          images: project.coverImage || project.image?.secureUrl ? [project.coverImage || project.image?.secureUrl || ""] : [],
        },
      }
    : { title: "Project not found" };
}

function isValidHttpUrl(str?: string): boolean {
  if (!str?.trim()) return false;
  try {
    const url = new URL(str.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project || !project.isPublished) notFound();

  const sections = [
    ["Overview", project.description],
    ["The problem", project.problem],
    ["The solution", project.solution],
    ["My contributions", project.contributions],
    ["Architecture & engineering", project.architecture],
    ["Challenges & decisions", project.challenges],
    ["Outcomes & lessons", project.outcomes],
  ].filter((item) => Boolean(item[1]?.trim()));

  const imageUrl = project.coverImage || project.image?.secureUrl;
  const altText = project.altText || project.image?.altText || `${project.title} project cover`;
  const coverStyle = imageUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(18,18,18,.06), rgba(18,18,18,.35)), url("${imageUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  const hasLiveUrl = isValidHttpUrl(project.liveUrl);
  const hasDemoUrl = isValidHttpUrl(project.demoUrl);
  const hasRepoUrl = isValidHttpUrl(project.repoUrl);

  return (
    <main>
      <section className="project-detail-hero">
        <div className="shell">
          <Link className="text-link" href="/projects">
            <ArrowLeft size={15} /> Back to projects
          </Link>
          <div className="project-detail-hero-grid">
            <div className="project-detail-heading">
              <span className="eyebrow">{project.category}</span>
              <h1>{project.title}</h1>
              <p>{project.summary}</p>
              <div className="detail-meta">
                <span>
                  <CalendarDays size={14} /> {project.year || "Project"}
                </span>
                <span>
                  <UserRound size={14} /> {project.role || "Software development"}
                </span>
              </div>
            </div>
            <div
              className={`project-detail-visual ${imageUrl ? "has-cover" : "has-placeholder"}`}
              style={coverStyle}
              role={imageUrl ? "img" : undefined}
              aria-label={imageUrl ? altText : undefined}
            >
              <span className="detail-visual-label">PROJECT SNAPSHOT</span>
              <span className="detail-visual-mark">
                <Layers3 size={44} strokeWidth={1.1} />
              </span>
              <span className="detail-visual-footer">
                {project.category.toUpperCase()} · {project.year || "CASE STUDY"}
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="shell detail-layout">
        <div className="detail-content">
          {sections.length ? (
            sections.map(([title, body]) => (
              <section key={title}>
                <h2>{title}</h2>
                <p style={{ whiteSpace: "pre-wrap" }}>{body}</p>
              </section>
            ))
          ) : (
            <div className="empty-public">This case study is being expanded. More project details will be added soon.</div>
          )}
          {project.architectureFlow && project.architectureFlow.length > 1 ? (
            <section>
              <h2>System flow</h2>
              <ArchitectureFlow nodes={project.architectureFlow} />
            </section>
          ) : null}
        </div>
        <aside className="detail-sidebar">
          <h3>Technologies</h3>
          <div className="tag-list">
            {(project.technologies || []).map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
          <h3>Project links</h3>
          <div className="detail-links">
            {hasLiveUrl ? (
              <a href={project.liveUrl.trim()} target="_blank" rel="noreferrer">
                Live application <ExternalLink size={14} />
              </a>
            ) : null}
            {hasDemoUrl ? (
              <a href={project.demoUrl.trim()} target="_blank" rel="noreferrer">
                Demonstration <ArrowUpRight size={14} />
              </a>
            ) : null}
            {hasRepoUrl ? (
              <a href={project.repoUrl.trim()} target="_blank" rel="noreferrer">
                Source repository <Github size={14} />
              </a>
            ) : null}
            {!hasLiveUrl && !hasDemoUrl && !hasRepoUrl ? (
              <span className="detail-no-links">Links will be added when available.</span>
            ) : null}
          </div>
        </aside>
      </section>
    </main>
  );
}
