import type { Metadata } from "next";
import { getProjects } from "@/lib/db";
import { ProjectCard } from "@/components/project-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projects", description: "Published software projects and engineering case studies by Katiso Ntseare." };

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <main className="portfolio-page projects-page">
      <section className="folio-page-hero"><div className="folio-shell folio-page-hero-grid"><div><span className="folio-kicker">Project archive</span><h1 className="folio-display">Work with a reason behind the build.</h1><p>Case studies document the problems, product decisions and engineering contributions behind selected software projects.</p></div><p className="folio-page-side-note">Published projects only<br />Images, system flows and demonstrations where available</p></div></section>
      <section className="folio-content"><div className="folio-shell">
        <div className="work-more folio-project-summary"><span className="folio-project-count">{projects.length} {projects.length === 1 ? "published case study" : "published case studies"}</span><span>Open a project to examine its engineering choices.</span></div>
        {projects.length ? <div className="folio-project-list">{projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div> : <div className="folio-empty">The project library is being prepared. New case studies will appear here as they are verified and published.</div>}
      </div></section>
    </main>
  );
}
