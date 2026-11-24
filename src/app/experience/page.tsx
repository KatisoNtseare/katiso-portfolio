import type { Metadata } from "next";

export const metadata: Metadata = { title: "Experience & approach", description: "Education, project work, entrepreneurship and engineering approach." };

const experience = [
  { period: "2025", title: "Software Developer / Product Developer — Taxar", description: "Contributed to product engineering across backend and frontend workflows, authentication, APIs, platform architecture, Git collaboration and deployment practices." },
  { period: "2025", title: "Computer Tutor — Nelson Mandela University", description: "Tutored students in Microsoft 365, C#, computer networks and information systems, using practical examples to build confidence in technical concepts and problem solving." },
  { period: "February 2025 – November 2026", title: "Chairman — GKSS", description: "Provided leadership and represented the student community, supporting collaboration, communication and professional development initiatives." },
  { period: "Graduate", title: "Diploma in Information Technology: Software Development", description: "Nelson Mandela University. Focus areas included software development, databases, networks, information systems, backend and frontend engineering." },
  { period: "2023", title: "Higher Certificate: Information Technology — User Support Services", description: "Nelson Mandela University. Built practical experience in hardware, operating systems, networking, troubleshooting and end-user technical support." },
  { period: "Entrepreneurship", title: "ProIT Solutions", description: "Building a technology business focused on software development, automation, cloud infrastructure and cybersecurity for practical organisational needs." },
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
          <div className="k-rows">
            {experience.map((item) => (
              <article className="k-row" key={item.title}>
                <span className="k-label">{item.period}</span>
                <div><h2>{item.title}</h2><p>{item.description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}