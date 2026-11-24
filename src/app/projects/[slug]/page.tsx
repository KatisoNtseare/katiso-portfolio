import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink, Github } from "lucide-react";
import { getProjectBySlug } from "@/lib/db";
import { ArchitectureFlow } from "@/components/architecture-flow";
import { MediaGallery } from "@/components/media-gallery";
import { getPrimaryImage } from "@/lib/media";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  const primary = getPrimaryImage(project.media);
  const ogImage = primary?.secureUrl || project.coverImage || project.image?.secureUrl || "";
  return {
    title: `${project.title} | Case Study`,
    description: project.summary,
    openGraph: { title: project.title, description: project.summary, images: ogImage ? [ogImage] : [] },
  };
}

function isValidHttpUrl(value?: string): boolean {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch { return false; }
}

function isNextImageSource(value?: string): value is string {
  if (!value) return false;
  if (value.startsWith("/")) return true;
  try { return new URL(value).hostname === "res.cloudinary.com"; } catch { return false; }
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
  ].filter((section) => Boolean(section[1]?.trim()));

  const primary = getPrimaryImage(project.media);
  const imageUrl = primary?.secureUrl || project.coverImage || project.image?.secureUrl;
  const altText = primary?.altText || project.altText || project.image?.altText || `${project.title} project cover`;
  const coverStyle = imageUrl && !isNextImageSource(imageUrl) ? { backgroundImage: `url("${imageUrl}")` } : undefined;
  const projectLinks = [
    { label: "Live application", href: project.liveUrl, icon: ExternalLink },
    { label: "Demonstration", href: project.demoUrl, icon: ArrowUpRight },
    { label: "Source repository", href: project.repoUrl, icon: Github },
  ].filter((item) => isValidHttpUrl(item.href));

    return (
    <main>
      <section className="k-case-head">
        <div className="k-shell">
          <Link className="k-back" href="/projects"><ArrowLeft size={15} aria-hidden="true" /> All projects</Link>
          <div className="k-case-title">
            <div><h1 className="k-display">{project.title}</h1><p className="k-summary">{project.summary}</p></div>
            <dl className="k-meta">
              <div><dt>Category</dt><dd>{project.category}</dd></div>
              <div><dt>Year</dt><dd>{project.year || "—"}</dd></div>
              <div><dt>Role</dt><dd>{project.role || "Software development"}</dd></div>
            </dl>
          </div>
          {imageUrl ? (
            <div className="k-case-visual" style={coverStyle} role="img" aria-label={altText}>
              {isNextImageSource(imageUrl) ? <Image src={imageUrl} alt="" fill priority sizes="(max-width: 1200px) 92vw, 1160px" /> : null}
            </div>
          ) : null}
        </div>
      </section>
      <div className="k-shell k-case-layout">
        <div className="case-content">
          {sections.length ? sections.map(([title, content]) => <section className="case-section" key={title}><h2>{title}</h2><p>{content}</p></section>) : <p className="k-empty">This case study is being expanded. More project details will be added soon.</p>}
          {project.architectureFlow && project.architectureFlow.length > 1 ? <section className="case-section"><h2>System flow</h2><ArchitectureFlow nodes={project.architectureFlow} /></section> : null}
          {project.media?.length ? <MediaGallery media={project.media} projectTitle={project.title} /> : null}
        </div>
        <aside className="k-case-side" aria-label="Project details">
          <div>
            <h2>Technology</h2>
            {(project.technologies || []).length ? <ul>{(project.technologies || []).map((technology) => <li key={technology}>{technology}</li>)}</ul> : <p className="k-muted">Not listed.</p>}
          </div>
          <div>
            <h2>Links</h2>
            {projectLinks.length ? <div className="k-case-links">{projectLinks.map(({ label, href, icon: Icon }) => <a href={href.trim()} target="_blank" rel="noreferrer" key={label}>{label}<Icon size={14} aria-hidden="true" /></a>)}</div> : <p className="k-muted">Links will appear here when available.</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}
