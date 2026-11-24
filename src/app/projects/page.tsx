import type { Metadata } from "next";
import { getProjects } from "@/lib/db";
import { ProjectCard } from "@/components/project-card";
import { HomeMotion } from "@/components/home-motion";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projects", description: "Published software projects and engineering case studies by Katiso Ntseare." };

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <main>
      <HomeMotion />
      <section className="folio-page-hero">
        <div className="k-shell">
          <h1 className="k-display">Software built for real operational problems.</h1>
          <p>Case studies document the constraints, product decisions and engineering contributions behind selected projects.</p>
        </div>
      </section>
      <section className="folio-content">
        <div className="k-shell">
          <p className="k-count">{projects.length} {projects.length === 1 ? "published case study" : "published case studies"}</p>
          {projects.length ? <div className="k-work-grid">{projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div> : <p className="k-empty">The project library is being prepared. New case studies will appear here as they are verified and published.</p>}
        </div>
      </section>
    </main>
  );
}