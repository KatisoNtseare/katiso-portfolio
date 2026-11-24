import type { Metadata } from "next";
import { SectionHeading } from "@/components/section-heading";
export const metadata: Metadata = { title: "Experience & approach" };
const experiences = [
  { period: "EDUCATION", title: "Diploma in Information Technology: Software Development", description: "Academic foundation in software development, systems analysis, databases and information technology." },
  { period: "ENTREPRENEURSHIP", title: "ProIT Solutions", description: "Building a technology business and developing software solutions around real organisational requirements." },
  { period: "SOFTWARE DELIVERY", title: "Client and product initiatives", description: "Practical work across application workflows, accommodation systems, learning platforms and operational software concepts. Individual contributions and delivery status are documented per case study." },
  { period: "MENTORING & LEADERSHIP", title: "Technical learning and community support", description: "Supporting peer learning through technical mentoring, programming guidance and collaborative learning initiatives." },
];
export default function ExperiencePage() {
  return <main><section className="page-hero"><div className="shell"><span className="eyebrow">EXPERIENCE / HOW I WORK</span><h1>Building capability<br />through practice.</h1><p>My professional journey combines formal software development education, hands-on project work, entrepreneurship and knowledge sharing.</p></div></section><section className="content-section"><div className="shell"><SectionHeading eyebrow="THE JOURNEY" title="Experience and development." description="This section will evolve as projects are completed and experience grows. Project pages distinguish individual contributions from team outcomes." /><div className="experience-list">{experiences.map((item)=><article className="experience-item" key={item.title}><span>{item.period}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></div></section></main>;
}
