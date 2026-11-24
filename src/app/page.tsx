import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Code2,
  ExternalLink,
  GitBranch,
  Layers3,
  Terminal,
} from "lucide-react";
import { getProjects } from "@/lib/db";
import { site, expertise } from "@/lib/site";
import { ProjectCard } from "@/components/project-card";
import { SectionHeading } from "@/components/section-heading";
import { GithubShowcase } from "@/components/github-showcase";
import { CvLink } from "@/components/cv-link";
import { LabPlayground } from "@/components/lab-playground";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allProjects = await getProjects();
  const projects = allProjects.filter((project) => project.isFeatured).slice(0, 4);
  const featured = projects.length ? projects : allProjects.slice(0, 4);

  return (
    <main>
      <section className="hero hero-refined">
        <div className="shell hero-grid">
          <div className="hero-content">
            <div className="hero-kicker">
              <span className="hero-kicker-mark"><Code2 size={15} /></span>
              <span>SOFTWARE DEVELOPER</span>
              <span className="hero-kicker-divider" />
              <span>FOUNDER, PROIT SOLUTIONS</span>
            </div>
            <h1>
              I build software
              <br />
              that solves <em>real problems.</em>
            </h1>
            <p className="hero-copy">
              I turn ideas and complex requirements into practical digital products, dependable backend systems and thoughtful web experiences.
              My work brings engineering discipline and business understanding together.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/projects">
                Explore my work <ArrowUpRight size={16} />
              </Link>
              <CvLink />
            </div>
            <div className="hero-meta">
              <span className="availability"><i /> Open to meaningful opportunities</span>
              <span className="hero-meta-divider" />
              <span>Software engineering · Product thinking · Delivery</span>
            </div>
            <a className="scroll-cue" href="#intro">
              <span>SCROLL TO EXPLORE</span>
              <ArrowDownRight size={14} />
            </a>
          </div>

          <div className="hero-visual hero-visual-refined" role="group" aria-label="A visual overview of Katiso's software engineering approach">
            <div className="hero-visual-orbit hero-visual-orbit-one" />
            <div className="hero-visual-orbit hero-visual-orbit-two" />
            <div className="hero-floating-label hero-floating-label-top"><span className="status-dot" /> BUILDING WITH INTENTION</div>
            <div className="hero-code-card">
              <div className="hero-code-topbar">
                <div className="hero-window-dots"><i /><i /><i /></div>
                <span><Terminal size={12} /> engineering.ts</span>
                <span className="hero-code-language">TS</span>
              </div>
              <div className="hero-code-body">
                <div className="code-line"><span>01</span><code><b>const</b> approach = &#123;</code></div>
                <div className="code-line"><span>02</span><code>&nbsp;&nbsp;problem: <i>&quot;understand&quot;</i>,</code></div>
                <div className="code-line"><span>03</span><code>&nbsp;&nbsp;solution: <i>&quot;engineer&quot;</i>,</code></div>
                <div className="code-line"><span>04</span><code>&nbsp;&nbsp;quality: <i>&quot;always&quot;</i>,</code></div>
                <div className="code-line"><span>05</span><code>&nbsp;&nbsp;impact: <i>&quot;deliver&quot;</i></code></div>
                <div className="code-line"><span>06</span><code>&#125;;</code></div>
              </div>
              <div className="hero-code-footer"><span><span className="status-dot" /> SYSTEM THINKING</span><span>BUILD · TEST · IMPROVE</span></div>
            </div>
            <div className="hero-floating-card hero-floating-card-left">
              <span className="floating-icon"><Layers3 size={16} /></span>
              <span><strong>Thoughtful architecture</strong><small>Clear boundaries. Useful systems.</small></span>
            </div>
            <div className="hero-floating-card hero-floating-card-right">
              <span className="floating-icon floating-icon-red"><GitBranch size={16} /></span>
              <span><strong>Built to evolve</strong><small>Maintainable by design.</small></span>
            </div>
            <span className="hero-visual-caption">FROM REQUIREMENTS TO RELIABLE SOFTWARE</span>
          </div>
        </div>
        <div className="shell hero-tech-strip">
          <span className="hero-tech-label">WORKING ACROSS</span>
          <div className="hero-tech-items"><span>C# / .NET</span><span>TypeScript</span><span>Next.js</span><span>Python</span><span>SQL</span><span>Cloud & CI/CD</span></div>
        </div>
      </section>

      <section className="section section-muted intro-section" id="intro">
        <div className="shell intro-grid">
          <div className="intro-aside"><span>01 / A LITTLE ABOUT ME</span><strong>ENGINEERING<br />WITH INTENTION</strong></div>
          <div>
            <div className="intro-copy">I&apos;m a <strong>Software Developer</strong> with a Diploma in Information Technology: Software Development. I enjoy understanding how systems fit together and translating requirements into applications that are useful, maintainable and reliable.</div>
            <p className="intro-supporting">My work spans application development, backend engineering, data, cloud fundamentals and the business thinking needed to deliver useful technology.</p>
            <Link className="text-link" href="/about">More about me <ArrowUpRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="section" id="expertise">
        <div className="shell">
          <SectionHeading eyebrow="02 / WHAT I WORK WITH" title="A practical engineering toolkit." description="I approach software as a connected system: user experience, application logic, data, delivery and the people who rely on it." />
          <div className="expertise-grid">
            {expertise.map((group, index) => (
              <article className="expertise-card" key={group.title}>
                <span className="expertise-number">0{index + 1} / DISCIPLINE</span>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
                <div className="tag-list">{group.items.map((item) => <span key={item}>{item}</span>)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-muted" id="projects">
        <div className="shell">
          <SectionHeading eyebrow="03 / SELECTED WORK" title="Projects built around real problems." description="A selection of software initiatives and engineering work. Open each case study to explore the context, my contributions and technical decisions." />
          {featured.length ? <div className="projects-grid">{featured.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div> : <div className="empty-public">Project case studies are being prepared. Please check back soon.</div>}
          <div className="projects-footer"><span>More than a screenshot. Explore the thinking behind the build.</span><Link className="text-link" href="/projects">Explore all projects <ArrowUpRight size={15} /></Link></div>
        </div>
      </section>

      <section className="section section-dark engineering-section">
        <div className="shell architecture-band">
          <div className="architecture-copy">
            <span className="eyebrow">04 / ENGINEERING APPROACH</span>
            <h2>Good software starts with good decisions.</h2>
            <p>I care about clean boundaries, reliable data, secure access, testable code and delivery practices that make software easier to evolve.</p>
            <Link className="text-link" href="/experience">Explore my approach <ArrowUpRight size={15} /></Link>
          </div>
          <div className="architecture-visual">
            <div className="architecture-visual-heading"><span className="eyebrow">A SYSTEM, NOT JUST A SCREEN</span><span className="architecture-live-dot">SYSTEM FLOW</span></div>
            <div className="arch-flow"><div className="arch-box">Experience<span>Interface</span></div><div className="arch-arrow">→</div><div className="arch-box">Application<span>Rules & APIs</span></div><div className="arch-arrow">→</div><div className="arch-box">Data<span>Persistence</span></div></div>
            <div className="arch-bottom"><div className="arch-box"><Code2 size={15} /> Security & access<span>Identity · Validation</span></div><div className="arch-box"><GitBranch size={15} /> Delivery & quality<span>Testing · CI/CD</span></div></div>
          </div>
        </div>
      </section>

      <section className="section section-dark github-section" id="github">
        <div className="shell">
          <SectionHeading eyebrow="05 / DEVELOPMENT FOOTPRINT" title="Open work. Public progress." description="A live snapshot of selected public repositories from GitHub. Repository data is fetched from the GitHub API and may be temporarily unavailable." dark />
          <GithubShowcase />
        </div>
      </section>

      <section className="section lab-section" id="lab">
        <div className="shell">
          <SectionHeading eyebrow="06 / INTERACTIVE LAB" title="Explore the engineering concepts." description="Small, self-contained demonstrations that make technical ideas easier to explore. These use sample data and do not modify production systems." />
          <LabPlayground />
        </div>
      </section>

      <section className="section section-muted proit-section" id="proit">
        <div className="shell proit-grid">
          <div className="proit-brand-panel"><div className="proit-wordmark">ProIT<span>&lt;/&gt;</span></div><span className="eyebrow">TECHNOLOGY · DELIVERY · INNOVATION</span><div className="proit-brand-note">A technology business built around practical outcomes.</div></div>
          <div className="proit-copy">
            <h2 className="section-title-compact">Engineering beyond the individual project.</h2>
            <p>I&apos;m also building ProIT Solutions, a technology business focused on helping organisations use software and modern technology to solve practical challenges.</p>
            <div className="service-list"><span className="service-item">Software development</span><span className="service-item">AI & automation</span><span className="service-item">Cloud & DevOps</span><span className="service-item">Cybersecurity</span></div>
            <div className="proit-link-wrap"><a href={site.proit} target="_blank" rel="noreferrer" className="text-link">Explore ProIT Solutions <ExternalLink size={14} /></a></div>
          </div>
        </div>
      </section>

      <section className="cta-band"><div className="shell cta-inner"><div><span className="eyebrow">HAVE AN OPPORTUNITY OR IDEA?</span><h2>Let&apos;s make something useful.</h2><p>Open to conversations about engineering roles, collaborations and software projects.</p></div><Link className="button button-primary" href="/contact">Start a conversation <ArrowRight size={16} /></Link></div></section>
    </main>
  );
}
