import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { getProjects } from "@/lib/db";
import { site, expertise } from "@/lib/site";
import { ProjectCard } from "@/components/project-card";
import { GithubShowcase } from "@/components/github-showcase";
import { CvLink } from "@/components/cv-link";
import { LabPlayground } from "@/components/lab-playground";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Software developer", description: site.description };

export default async function HomePage() {
  const allProjects = await getProjects();
  const featured = allProjects.filter((project) => project.isFeatured).slice(0, 3);
  const projects = featured.length ? featured : allProjects.slice(0, 3);

  return (
    <main className="portfolio-page home-page">
      <section className="home-hero">
        <div className="folio-shell home-hero-grid">
          <div className="home-hero-copy">
            <span className="folio-kicker">Software developer · ProIT Solutions</span>
            <h1 className="folio-display"><span>Software for</span><span>real work.</span></h1>
            <p className="home-hero-intro">I turn complex requirements into useful applications and dependable systems. My work connects engineering discipline with the way people and organisations actually operate.</p>
            <div className="home-hero-actions">
              <Link className="folio-button" href="/projects">Explore selected work <ArrowRight size={16} aria-hidden="true" /></Link>
              <CvLink />
            </div>
            <p className="home-availability">Open to meaningful software engineering opportunities</p>
          </div>
          <figure className="home-portrait">
            <Image src="/images/halfPicture.jpg" alt="Katiso Ntseare, software developer and founder of ProIT Solutions" fill priority sizes="(max-width: 700px) 90vw, 38vw" />
            <figcaption className="home-portrait-caption"><strong>Katiso Ntseare</strong><span>Engineering · delivery · impact</span></figcaption>
          </figure>
        </div>
      </section>

      <div className="home-tool-ribbon" aria-label="Core technologies">
        <div className="folio-shell home-tool-inner"><span className="home-tool-label">Tools I work with</span><div className="home-tool-list"><span>C# / .NET</span><span>TypeScript</span><span>Next.js</span><span>Python</span><span>SQL</span><span>Cloud & CI/CD</span></div></div>
      </div>

      <section className="home-section" id="expertise">
        <div className="folio-shell">
          <div className="home-section-heading"><span className="folio-kicker">Engineering practice</span><div><h2 className="folio-display">A connected view of software.</h2><p>I work across the layers that make a product dependable: interfaces, application rules, data, security and delivery.</p></div></div>
          <div className="expertise-list">
            {expertise.map((group) => (
              <article className="expertise-row" key={group.title}>
                <h3>{group.title}</h3><p>{group.description}</p>
                <div className="tag-list">{group.items.map((item) => <span className="folio-tag" key={item}>{item}</span>)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section-white" id="work">
        <div className="folio-shell">
          <div className="home-section-heading"><span className="folio-kicker">Selected work</span><div><h2 className="folio-display">Projects with a reason behind the build.</h2><p>Explore the problems, engineering choices and contributions behind each published case study.</p></div></div>
          {projects.length ? <div className="work-grid">{projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div> : <div className="folio-empty">Project case studies are being prepared. Please check back soon.</div>}
          <div className="work-more"><span>Each case study documents the context, system and outcome.</span><Link className="folio-link" href="/projects">Browse all projects <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section className="home-section home-section-dark">
        <div className="folio-shell home-journey">
          <div><span className="folio-kicker">Experience in practice</span><h2 className="folio-display">Learning by building, improving and sharing.</h2><p>My path combines formal study, applied software work and the challenge of building a technology business.</p><Link className="folio-link" href="/experience">Read about my experience <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
          <div className="journey-list">
            <article className="journey-item"><span>Education</span><div><h3>Software development foundation</h3><p>Diploma in Information Technology: Software Development, with grounding in systems analysis, databases and application design.</p></div></article>
            <article className="journey-item"><span>ProIT Solutions</span><div><h3>Building a technology business</h3><p>Developing software and technology services around practical organisational needs.</p></div></article>
            <article className="journey-item"><span>Project delivery</span><div><h3>From requirements to working systems</h3><p>Applied experience across web applications, operational workflows, data and engineering fundamentals.</p></div></article>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="folio-shell folio-engineering">
          <div><span className="folio-kicker">How I think about a build</span><h2 className="folio-display">Good software starts with decisions.</h2><p>Readable code matters. So do the boundaries, data rules, access controls and delivery practices that keep a product useful as it grows.</p></div>
          <div className="engineering-steps" aria-label="Engineering principles">
            <div className="engineering-step"><span>01</span><strong>Understand the user and the operating context</strong></div>
            <div className="engineering-step"><span>02</span><strong>Model the rules before they become edge cases</strong></div>
            <div className="engineering-step"><span>03</span><strong>Deliver in a way the next person can maintain</strong></div>
          </div>
        </div>
      </section>

      <section className="home-section home-section-dark" id="github">
        <div className="folio-shell">
          <div className="home-section-heading"><span className="folio-kicker">Public development work</span><div><h2 className="folio-display">A live view of what I build in the open.</h2><p>Selected public repositories are loaded from GitHub. The profile remains available if live repository data cannot be reached.</p></div></div>
          <GithubShowcase />
        </div>
      </section>

      <section className="home-section" id="lab">
        <div className="folio-shell">
          <div className="home-section-heading"><span className="folio-kicker">Interactive engineering notes</span><div><h2 className="folio-display">Small ideas, made explorable.</h2><p>Safe, self-contained demonstrations of common engineering concepts. The sample data never touches production systems.</p></div></div>
          <LabPlayground />
        </div>
      </section>

      <section className="home-section home-section-white" id="proit">
        <div className="folio-shell proit-panel">
          <div className="proit-panel-brand"><strong>ProIT<span>&lt;/&gt;</span></strong><small>Technology · delivery · innovation</small></div>
          <div className="proit-panel-copy"><h2>Engineering beyond the individual project.</h2><p>I&apos;m also building ProIT Solutions, a technology business focused on helping organisations use software and modern technology to solve practical challenges.</p><div className="proit-services"><span>Software development</span><span>AI & automation</span><span>Cloud & DevOps</span><span>Cybersecurity</span></div><a href={site.proit} target="_blank" rel="noreferrer" className="folio-link">Explore ProIT Solutions <ExternalLink size={15} aria-hidden="true" /></a></div>
        </div>
      </section>

      <section className="folio-cta"><div className="folio-shell folio-cta-inner"><div><h2>Let&apos;s make something useful.</h2><p>Open to conversations about engineering roles, collaborations and software projects.</p></div><Link className="folio-button" href="/contact">Start a conversation <ArrowUpRight size={16} aria-hidden="true" /></Link></div></section>
    </main>
  );
}
