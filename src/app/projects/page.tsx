import type { Metadata } from "next";
import { getProjects } from "@/lib/db";
import { ProjectCard } from "@/components/project-card";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projects", description: "Selected software development projects and engineering case studies." };
export default async function ProjectsPage() {
  const projects = await getProjects();
  return <main><section className="page-hero"><div className="shell"><span className="eyebrow">PROJECTS / SELECTED WORK</span><h1>Work with a reason<br />behind the build.</h1><p>Explore selected software projects, the problems they address, the engineering decisions behind them and my contributions.</p></div></section><section className="content-section"><div className="shell">{projects.length ? <div className="projects-grid">{projects.map((project,index)=><ProjectCard key={project.id} project={project} index={index} />)}</div> : <div className="empty-public">The project library is being prepared. New case studies will appear here as they are verified and published.</div>}</div></section></main>;
}
