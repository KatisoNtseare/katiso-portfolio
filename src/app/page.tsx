import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ExternalLink, Linkedin } from "lucide-react";
import { getProjects } from "@/lib/db";
import { site, expertise } from "@/lib/site";
import { ProjectCard } from "@/components/project-card";
import { GithubShowcase } from "@/components/github-showcase";
import { CvLink } from "@/components/cv-link";
import { HomeMotion } from "@/components/home-motion";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Software developer", description: site.description };

const background = [
  { label: "Education", title: "Diploma in Information Technology", text: "Graduated in Software Development from Nelson Mandela University, with grounding in systems analysis, databases and application design." },
  { label: "2025–2026", title: "Chairman, GKSS", text: "Served as Chairman of the Graduate and Career Society from February 2025 to November 2026, supporting student engagement, leadership and professional development." },
  { label: "Work experience", title: "Product and software development", text: "Experience as a Software Developer at Taxar and as a Computer Tutor at Nelson Mandela University." },
];

const engineeringStack = [
  { label: "Backend", items: ["C#", "ASP.NET Core", "Python", "FastAPI"] },
  { label: "Frontend", items: ["Next.js", "React", "TypeScript", "JavaScript"] },
  { label: "Data", items: ["SQL Server", "T-SQL", "PostgreSQL", "MongoDB"] },
  { label: "Delivery", items: ["Docker", "Linux", "IIS", "GitHub"] },
  { label: "Security", items: ["JWT", "RBAC", "Secure APIs", "CORS"] },
];

const featuredEngineering = [
  {
    name: "Luminar Learning",
    type: "University final-year project",
    summary: "A multi-service learning and tutoring platform connecting role-specific workflows across the frontend, API, database and document processing layers.",
    points: ["Role-based authentication", "Student, tutor and academy workflows", "Payments and document processing"],
    href: "/projects/luminar-learning",
  },
  {
    name: "Affinity Voting Platform",
    type: "Student voting system",
    summary: "A role-based voting application for residences and buildings with configurable categories and controlled one-vote-per-category rules.",
    points: ["Administrative workflows", "Residence and building access", "Production deployment controls"],
    href: "/projects/affinity-voting-platform",
  },
];

export default async function HomePage() {
  const allProjects = await getProjects();
  const featured = allProjects.filter((project) => project.isFeatured).slice(0, 3);
  const projects = featured.length ? featured : allProjects.slice(0, 3);

  return (
    <main>
      <HomeMotion />

      <section className="k-hero">
        <div className="k-shell k-hero-grid">
          <div>
            <p className="k-label">Katiso Ntseare, IT professional, Tech Entrepreneur</p>
            <h1 className="k-display">I build digital products <em>that work beautifully.</em></h1>
            <p className="k-hero-intro">Software developer specialising in backend engineering, full-stack applications, DevOps and security. Open to graduate and junior engineering opportunities across South Africa.</p>
            <div className="k-actions ">
              <Link className="k-btn" href="/projects">Selected work <ArrowRight size={16} aria-hidden="true" /></Link>
              <CvLink />
              {site.linkedin ? <a className="k-btn k-btn-ghost" href={site.linkedin} target="_blank" rel="noreferrer"><Linkedin size={16} aria-hidden="true" /> LinkedIn</a> : null}
            </div>   
          </div>
          <figure className="k-portrait">
            <div className="k-portrait-frame">
              <Image src="/images/halfPicture.jpg" alt="Katiso Ntseare, software developer and founder of ProIT Solutions" fill priority sizes="(max-width: 900px) 340px, 34vw" />
            </div> 
          </figure>
        </div>
      </section> 

      <section className="k-section k-section--paper" id="featured-engineering">
        <div className="k-shell">
          <div className="k-section-head">
            <span className="k-label">Featured engineering</span>
            <div>
              <h2 className="k-display">Complex problems, designed from end to end.</h2>
              <p>Selected work demonstrates how I approach product architecture, security, data and application delivery.</p>
            </div>
          </div>
          <div className="k-feature-grid">
            {featuredEngineering.map((project) => (
              <article className="k-feature-card" key={project.name}>
                <div className="k-feature-card-head">
                  <span className="k-label">{project.type}</span>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </div>
                <h3>{project.name}</h3>
                <p>{project.summary}</p>
                <ul>{project.points.map((point) => <li key={point}>{point}</li>)}</ul>
                <Link className="k-link" href={project.href}>View project <ArrowRight size={15} aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="k-section k-section--paper" id="work">
        <div className="k-shell">
          <div className="k-section-head">
            <span className="k-label">Selected work</span>
            <div>
              <h2 className="k-display">Projects built around operational needs.</h2>
              <p>Each case study covers the context, the system and what came out of it.</p>
            </div>
          </div>
          {projects.length ? <div className="k-work-grid">{projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div> : <p className="k-empty">Project case studies are being prepared. Please check back soon.</p>}
          <div className="k-more"><span>More case studies are added as they are verified.</span><Link className="k-link" href="/projects">All projects <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section className="k-section k-section--sand" id="capabilities">
        <div className="k-shell">
          <div className="k-section-head">
            <span className="k-label">Capabilities</span>
            <div>
              <h2 className="k-display">From interface to infrastructure.</h2>
              <p>Interfaces, application rules, data, security and delivery all decide whether a product works in practice.</p>
            </div>
          </div>
          <div className="k-rows">
            {expertise.map((group) => (
              <article className="k-row" key={group.title} data-reveal>
                <h3>{group.title}</h3>
                <div><p>{group.description}</p><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="k-section k-section--paper" id="stack">
        <div className="k-shell">
          <div className="k-section-head">
            <span className="k-label">Core stack</span>
            <div>
              <h2 className="k-display">One toolkit across the product lifecycle.</h2>
              <p>I move between application code, databases, infrastructure, security boundaries and deployment workflows.</p>
            </div>
          </div>
          <div className="k-stack-grid">
            {engineeringStack.map((group) => (
              <article className="k-stack-card" key={group.label}>
                <h3>{group.label}</h3>
                <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="k-section k-section--tint" id="background">
        <div className="k-shell">
          <div className="k-section-head">
            <span className="k-label">Background</span>
            <div>
              <h2 className="k-display">Study, applied work and a company of my own.</h2>
              <p><Link className="k-link" href="/experience">Read about my experience <ArrowUpRight size={15} aria-hidden="true" /></Link></p>
            </div>
          </div>
          <div className="k-rows">
            {background.map((item) => (
              <article className="k-row" key={item.title} data-reveal>
                <span className="k-label">{item.label}</span>
                <div><h3>{item.title}</h3><p>{item.text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="k-section k-section--blueprint" id="github">
        <div className="k-shell">
          <div className="k-section-head">
            <span className="k-label">Open source</span>
            <div>
              <h2 className="k-display">What I’m building in public.</h2>
              <p>Public repositories, loaded live from GitHub.</p>
            </div>
          </div>
          <GithubShowcase />
        </div>
      </section>

      <section className="k-band" id="proit">
        <div className="k-shell k-band-grid">
          <span className="k-label">ProIT Solutions</span>
          <div>
            <h2 className="k-display">I also run a technology company.</h2>
            <p>I’m building ProIT Solutions, a technology business focused on helping organisations use software and modern technology to solve practical challenges.</p>
            <ul aria-label="ProIT services"><li>Software development</li><li>AI &amp; automation</li><li>Cloud &amp; DevOps</li><li>Cybersecurity</li></ul>
            <div className="k-actions">
              <a className="k-link" href={site.proit} target="_blank" rel="noreferrer">ProIT Solutions <ExternalLink size={15} aria-hidden="true" /></a>
              <a className="k-link" href={site.managedCloud} target="_blank" rel="noreferrer">ProIT Managed Cloud <ExternalLink size={15} aria-hidden="true" /></a>
            </div>
          </div>
        </div>
      </section>

      <section className="k-cta">
        <div className="k-shell k-cta-inner">
          <div>
            <h2 className="k-display">Have a problem worth solving?</h2>
            <p>Let’s discuss software engineering, backend or full-stack roles, graduate opportunities, collaborations or practical technology projects.</p>
          </div>
          <Link className="k-btn" href="/contact">Get in touch <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  );
}
