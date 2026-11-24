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
    <main className="portfolio-page case-page">
      <section className="case-hero">
        <div className="folio-shell">
          <Link className="case-back" href="/projects"><ArrowLeft size={15} aria-hidden="true" /> All projects</Link>
          <div className="case-heading">
            <div><span className="folio-kicker">{project.category}</span><h1 className="folio-display">{project.title}</h1><p>{project.summary}</p></div>
            <dl className="case-meta"><div><dt>Year</dt><dd>{project.year || "Project"}</dd></div><div><dt>Role</dt><dd>{project.role || "Software development"}</dd></div></dl>
          </div>
          <div className="case-visual" style={coverStyle} role={imageUrl ? "img" : undefined} aria-label={imageUrl ? altText : undefined}>
            {isNextImageSource(imageUrl) ? <Image src={imageUrl} alt="" fill priority sizes="(max-width: 700px) 90vw, 100vw" className="case-image" /> : null}
            {!imageUrl ? <div className="work-visual-placeholder" aria-hidden="true"><span>{project.category}</span></div> : null}
            <div className="case-visual-caption"><span>{project.category}</span><span>{project.year || "Engineering case study"}</span></div>
          </div>
        </div>
      </section>
      <div className="folio-shell case-layout">
        <div className="case-content">
          {sections.length ? sections.map(([title, content]) => <section className="case-section" key={title}><h2>{title}</h2><p>{content}</p></section>) : <div className="folio-empty">This case study is being expanded. More project details will be added soon.</div>}
          {project.architectureFlow && project.architectureFlow.length > 1 ? <section className="case-section"><h2>System flow</h2><ArchitectureFlow nodes={project.architectureFlow} /></section> : null}
          {project.media?.length ? <MediaGallery media={project.media} projectTitle={project.title} /> : null}
        </div>
        <aside className="case-sidebar" aria-label="Project details">
          <h2>Technology</h2><div className="case-tech">{(project.technologies || []).map((technology) => <span className="folio-tag" key={technology}>{technology}</span>)}</div>
          <h2>Project links</h2>
          {projectLinks.length ? <div className="case-links">{projectLinks.map(({ label, href, icon: Icon }) => <a href={href.trim()} target="_blank" rel="noreferrer" key={label}>{label}<Icon size={14} aria-hidden="true" /></a>)}</div> : <span className="case-no-links">Links will appear here when available.</span>}
        </aside>
      </div>
    </main>
  );
}
