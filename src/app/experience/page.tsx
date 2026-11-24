import type { Metadata } from "next";

export const metadata: Metadata = { title: "Experience & approach", description: "Education, project work, entrepreneurship and engineering approach." };

const workExperience = [
  { period: "2025", title: "Software Developer / Product Developer — Taxar", description: "Contributed to product engineering across backend and frontend workflows, authentication, APIs, platform architecture, Git collaboration and deployment practices." },
  { period: "2025", title: "Computer Tutor — Nelson Mandela University", description: "Tutored students in Microsoft 365, C#, computer networks and information systems, using practical examples to build confidence in technical concepts and problem solving." },
];

const education = [
  { period: "Completed", title: "Diploma in Information Technology: Software Development", description: "Nelson Mandela University. Studies covered software development, databases, networks, information systems, backend and frontend engineering." },
  { period: "2023", title: "Higher Certificate in Information Technology: User Support Services", description: "Nelson Mandela University. Built practical experience in computer hardware and software support, operating systems, networking, troubleshooting and end-user support." },
];

const leadership = [
  {
    period: "February 2025 – November 2026",
    title: "Chairman — Geekulcha Student Society (GKSS)",
    description: "Led the student-led technology community chapter with a focus on helping students connect academic theory with practical innovation. GKSS organises hackathons, coding boot camps, technical workshops and community outreach programmes across South African and African university and college campuses.",
  },
];

const ventures = [
  {
    period: "Founder · Registered company",
    title: "ProIT Solutions (Pty) Ltd",
    description: "A South African technology company specialising in software engineering, digital transformation and intelligent digital systems. Services include custom software development, web and application development, AI and business automation, cloud and DevOps engineering, cybersecurity, SaaS development, technology consulting and ProIT Academy.",
  },
  {
    period: "Founder · ProIT service brand",
    title: "PROIT Managed Cloud",
    description: "A managed cloud services offering operated by ProIT Solutions. It provides managed website hosting, business email, cloud storage, automated backups, application hosting, infrastructure and database management, technical support and maintenance.",
  },
];

export default function ExperiencePage() {
  return (
    <main>
      <section className="folio-page-hero">
        <div className="k-shell">
          <h1 className="k-display">Capability grows through practice.</h1>
          <p>My professional path combines software development education, applied project work, entrepreneurship and knowledge sharing.</p>
        </div>
      </section>
      <section className="folio-content">
        <div className="k-shell">
          <section className="k-experience-group">
            <h2 className="k-display">Work experience</h2>
            <div className="k-rows">
              {workExperience.map((item) => (
                <article className="k-row" key={item.title}>
                  <span className="k-label">{item.period}</span>
                  <div><h2>{item.title}</h2><p>{item.description}</p></div>
                </article>
              ))}
            </div>
          </section>

          <section className="k-experience-group">
            <h2 className="k-display">Education</h2>
            <div className="k-rows">
              {education.map((item) => (
                <article className="k-row" key={item.title}>
                  <span className="k-label">{item.period}</span>
                  <div><h2>{item.title}</h2><p>{item.description}</p></div>
                </article>
              ))}
            </div>
          </section>

          <section className="k-experience-group">
            <h2 className="k-display">Leadership</h2>
            <div className="k-rows">
              {leadership.map((item) => (
                <article className="k-row" key={item.title}>
                  <span className="k-label">{item.period}</span>
                  <div><h2>{item.title}</h2><p>{item.description}</p></div>
                </article>
              ))}
            </div>
          </section>

          <section className="k-experience-group">
            <h2 className="k-display">Ventures</h2>
            <div className="k-rows">
              {ventures.map((item) => (
                <article className="k-row" key={item.title}>
                  <span className="k-label">{item.period}</span>
                  <div><h2>{item.title}</h2><p>{item.description}</p></div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}