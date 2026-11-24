import type { Metadata } from "next";

export const metadata: Metadata = { title: "Experience & approach", description: "Education, project work, entrepreneurship and engineering approach." };

const experience = [
  { period: "Formal foundation", title: "Diploma in Information Technology: Software Development", description: "Academic grounding in software development, systems analysis, databases and information technology." },
  { period: "Entrepreneurship", title: "ProIT Solutions", description: "Building a technology business and developing software solutions around real organisational requirements." },
  { period: "Applied engineering", title: "Client and product initiatives", description: "Practical work across application workflows, accommodation systems, learning platforms and operational software concepts. Individual contributions and delivery status are documented per case study." },
  { period: "Knowledge sharing", title: "Technical learning and community support", description: "Supporting peer learning through technical mentoring, programming guidance and collaborative learning initiatives." },
];

export default function ExperiencePage() {
  return (
    <main className="portfolio-page experience-page">
      <section className="folio-page-hero"><div className="folio-shell folio-page-hero-grid"><div><span className="folio-kicker">Experience & approach</span><h1 className="folio-display">Capability grows through practice.</h1><p>My professional path combines software development education, applied project work, entrepreneurship and knowledge sharing.</p></div><p className="folio-page-side-note">A developing practice<br />Grounded in learning and delivery</p></div></section>
      <section className="folio-content"><div className="folio-shell"><div className="folio-experience-list">{experience.map((item) => <article className="folio-experience-item" key={item.title}><span>{item.period}</span><div><h2>{item.title}</h2><p>{item.description}</p></div></article>)}</div></div></section>
    </main>
  );
}
