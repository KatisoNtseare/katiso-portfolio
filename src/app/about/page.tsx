import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CvLink } from "@/components/cv-link";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About", description: "The background and engineering approach of Katiso Ntseare." };

const principles = [
  { title: "Understand first", text: "Clarify the need before adding complexity." },
  { title: "Make boundaries clear", text: "Keep rules, data and access deliberate." },
  { title: "Build for change", text: "Prefer readable systems over clever shortcuts." },
  { title: "Deliver with care", text: "Testing and reliability belong in the work." },
];

export default function AboutPage() {
  return (
    <main>
      <section className="folio-page-hero">
        <div className="k-shell">
          <h1 className="k-display">I like knowing how the whole system works.</h1>
          <p>My work starts with understanding the people, rules and constraints around a problem, then shaping a clear path from requirement to dependable software.</p>
        </div>
      </section>
      <section className="folio-content">
        <div className="k-shell k-about">
          <figure className="k-about-portrait"><Image src="/images/fullPicture.jpg" alt="Katiso Ntseare" fill sizes="(max-width: 900px) 360px, 34vw" /></figure>
          <div className="k-prose">
            <p className="k-lede">I’m a software developer with a Diploma in Information Technology: Software Development.</p>
            <p>I enjoy understanding how systems fit together and translating requirements into applications that are useful, maintainable and reliable. My interests span backend development, full-stack applications, database engineering and system design.</p>
            <p>My engineering mindset is practical. I value clear requirements, deliberate architecture, readable code and testing. I think carefully about access, data integrity and the people who will maintain a system after its first release.</p>
            <p>Alongside software development, I’m building ProIT Solutions, an initiative focused on delivering technology solutions to businesses and organisations. It keeps my attention on the connection between technical decisions and real operating needs.</p>
            <div className="k-principles">{principles.map((item) => <div key={item.title}><strong>{item.title}</strong><span>{item.text}</span></div>)}</div>
            <div className="k-actions">
              <CvLink />
              <a className="k-btn k-btn-ghost" href={site.github} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={15} aria-hidden="true" /></a>
              <Link className="k-link" href="/experience">Experience <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}