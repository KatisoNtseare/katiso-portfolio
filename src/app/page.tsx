import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { getProjects } from "@/lib/db";
import { site, expertise } from "@/lib/site";
import { ProjectCard } from "@/components/project-card";
import { GithubShowcase } from "@/components/github-showcase";
import { CvLink } from "@/components/cv-link";
import { TechnologyStack } from "@/components/technology-stack";
import { HomeMotion } from "@/components/home-motion";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Software developer", description: site.description };

export default async function HomePage() {
  const allProjects = await getProjects();
  const featured = allProjects.filter((project) => project.isFeatured).slice(0, 3);
  const projects = featured.length ? featured : allProjects.slice(0, 3);
  const leadProject = projects[0];
  const leadImageUrl = leadProject?.coverImage || leadProject?.image?.secureUrl;
  const leadImageCanOptimize = Boolean(leadImageUrl && (leadImageUrl.startsWith("/") || (() => {
    try { return new URL(leadImageUrl).hostname === "res.cloudinary.com"; } catch { return false; }
  })()));

  return (
    <main className="portfolio-page home-page">
      <HomeMotion />
      <section className="home-hero">
        <div className="folio-shell home-hero-grid">
          <div className="home-hero-copy">
            <span className="folio-kicker">Software developer · ProIT Solutions</span>
            <h1 className="folio-display"><span>Katiso Ntseare</span><span>Software built around real work.</span></h1>
            <p className="home-hero-intro">I design and build web applications, backend services and cloud systems that turn operational needs into dependable software.</p>
            <div className="home-hero-actions">
              <Link className="folio-button" href="/projects">Explore selected work <ArrowRight size={16} aria-hidden="true" /></Link>
              <CvLink />
            </div>
            <p className="home-availability">Open to meaningful software engineering opportunities</p>
          </div>
          <div className="home-hero-visual">
            <figure className="home-portrait">
              <Image src="/images/halfPicture.jpg" alt="Katiso Ntseare, software developer and founder of ProIT Solutions" fill priority sizes="(max-width: 700px) 78vw, 38vw" />
              <figcaption className="home-portrait-caption"><strong>Katiso Ntseare</strong><span>Founder, ProIT Solutions</span></figcaption>
            </figure>
            {leadProject ? (
              <Link className="home-hero-project" href={"/projects/" + leadProject.slug} aria-label={"Explore featured project: " + leadProject.title}>
                <span className="home-hero-project-image" aria-hidden="true">
                  {leadImageCanOptimize && leadImageUrl ? <Image src={leadImageUrl} alt="" fill sizes="(max-width: 700px) 34vw, 190px" /> : <span className="home-hero-project-mark">01</span>}
                </span>
                <span className="home-hero-project-copy">
                  <span className="home-hero-project-label"><i /> Selected project</span>
                  <strong>{leadProject.title}</strong>
                  <span className="home-hero-project-summary">{leadProject.summary}</span>
                  <span className="home-hero-project-link">View case study <ArrowUpRight size={15} aria-hidden="true" /></span>
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="home-section" id="expertise">
        <div className="folio-shell">
          <div className="home-section-heading"><div><h2 className="folio-display">I work across the layers that make software dependable.</h2><p>Interfaces, application rules, data, security and delivery all shape whether a product works in practice.</p></div></div>
          <div className="expertise-list">
            {expertise.map((group) => (
              <article className="expertise-row" data-gsap-reveal key={group.title}>
                <h3>{group.title}</h3><p>{group.description}</p>
                <div className="tag-list">{group.items.map((item) => <span className="folio-tag" key={item}>{item}</span>)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section-white" id="technologies">
        <div className="folio-shell">
          <div className="home-section-heading"><div><h2 className="folio-display">Technologies I use to build and operate software.</h2><p>From application development and data systems to deployment and cloud operations.</p></div></div>
          <TechnologyStack />
        </div>
      </section>

      <section className="home-section" id="work">
        <div className="folio-shell">
          <div className="home-section-heading"><div><h2 className="folio-display">Real problems. Thoughtful engineering. Working software.</h2><p>See the needs behind each project, the technical decisions made, and the outcomes documented in its case study.</p></div></div>
          {projects.length ? <div className="work-grid">{projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div> : <div className="folio-empty">Project case studies are being prepared. Please check back soon.</div>}
          <div className="work-more"><span>Each case study documents the context, system and outcome.</span><Link className="folio-link" href="/projects">Browse all projects <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section className="home-section home-section-dark">
        <div className="folio-shell home-journey">
          <div><h2 className="folio-display">Learning by building, improving and sharing.</h2><p>My path combines formal study, applied software work and the challenge of building a technology business.</p><Link className="folio-link" href="/experience">Read about my experience <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
          <div className="journey-list">
            <article className="journey-item" data-gsap-reveal><span>Education</span><div><h3>Software development foundation</h3><p>Diploma in Information Technology: Software Development, with grounding in systems analysis, databases and application design.</p></div></article>
            <article className="journey-item" data-gsap-reveal><span>ProIT Solutions</span><div><h3>Building a technology business</h3><p>Developing software and technology services around practical organisational needs.</p></div></article>
            <article className="journey-item" data-gsap-reveal><span>Project delivery</span><div><h3>From requirements to working systems</h3><p>Applied experience across web applications, operational workflows, data and engineering fundamentals.</p></div></article>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="folio-shell folio-engineering">
          <div><h2 className="folio-display">Good software starts with clear decisions.</h2><p>Readable code matters. So do the boundaries, data rules, access controls and delivery practices that keep a product useful as it grows.</p></div>
          <div className="engineering-steps" aria-label="Engineering principles">
            <div className="engineering-step" data-gsap-reveal><span>01</span><strong>Understand the user and the operating context</strong></div>
            <div className="engineering-step" data-gsap-reveal><span>02</span><strong>Model the rules before they become edge cases</strong></div>
            <div className="engineering-step" data-gsap-reveal><span>03</span><strong>Deliver in a way the next person can maintain</strong></div>
          </div>
        </div>
      </section>

      <section className="home-section home-section-dark" id="github">
        <div className="folio-shell">
          <div className="home-section-heading"><div><h2 className="folio-display">A live view of what I build in the open.</h2><p>Selected public repositories are loaded from GitHub. The profile remains available if live repository data cannot be reached.</p></div></div>
          <div data-gsap-reveal><GithubShowcase /></div>
        </div>
      </section>

      <section className="home-section home-section-white" id="proit">
        <div className="folio-shell proit-panel">
          <div className="proit-panel-brand" data-gsap-reveal><strong>ProIT<span>&lt;/&gt;</span></strong><small>Technology · delivery · innovation</small></div>
          <div className="proit-panel-copy" data-gsap-reveal><h2>Engineering beyond the individual project.</h2><p>I&apos;m also building ProIT Solutions, a technology business focused on helping organisations use software and modern technology to solve practical challenges.</p><div className="proit-services"><span>Software development</span><span>AI & automation</span><a className="proit-managed-cloud" href={site.managedCloud} target="_blank" rel="noreferrer">ProIT Managed Cloud <ExternalLink size={14} aria-hidden="true" /></a><span>Cloud & DevOps</span><span>Cybersecurity</span></div><a href={site.proit} target="_blank" rel="noreferrer" className="folio-link">Explore ProIT Solutions <ExternalLink size={15} aria-hidden="true" /></a></div>
        </div>
      </section>

      <section className="folio-cta"><div className="folio-shell folio-cta-inner"><div data-gsap-reveal><h2>Have a problem worth solving?</h2><p>Let&apos;s talk about an engineering role, collaboration or software project.</p></div><Link className="folio-button" href="/contact" data-gsap-reveal>Tell me about it <ArrowUpRight size={16} aria-hidden="true" /></Link></div></section>
    </main>
  );
}
