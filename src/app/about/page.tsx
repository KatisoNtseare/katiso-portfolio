import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CvLink } from "@/components/cv-link";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About", description: "The background and engineering approach of Katiso Ntseare." };

export default function AboutPage() {
  return (
    <main className="portfolio-page about-page">
      <section className="folio-page-hero"><div className="folio-shell folio-page-hero-grid"><div><h1 className="folio-display">I like knowing how the whole system works.</h1><p>My work starts with understanding the people, rules and constraints around a problem, then shaping a clear path from requirement to dependable software.</p></div><p className="folio-page-side-note">Software developer<br />Building ProIT Solutions<br />Focused on practical outcomes</p></div></section>
      <section className="folio-content"><div className="folio-shell about-layout">
        <figure className="about-portrait"><Image src="/images/fullPicture.jpg" alt="Katiso Ntseare" fill sizes="(max-width: 700px) 90vw, 34vw" /></figure>
        <div className="about-copy">
          <p className="about-lede">I&apos;m a Software Developer with a Diploma in Information Technology: Software Development.</p>
          <p>I enjoy understanding how systems fit together and translating requirements into applications that are useful, maintainable and reliable. My interests span backend development, full-stack applications, database engineering and system design.</p>
          <p>My engineering mindset is practical. I value clear requirements, deliberate architecture, readable code and testing. I think carefully about access, data integrity and the people who will maintain a system after its first release.</p>
          <p>Alongside software development, I&apos;m building ProIT Solutions: an initiative focused on delivering technology solutions to businesses and organisations. It keeps my attention on the connection between technical decisions and real operating needs.</p>
          <div className="about-focus" aria-label="Engineering principles"><div><strong>Understand first</strong><span>Clarify the need before adding complexity.</span></div><div><strong>Make boundaries clear</strong><span>Keep rules, data and access deliberate.</span></div><div><strong>Build for change</strong><span>Prefer readable systems over clever shortcuts.</span></div><div><strong>Deliver with care</strong><span>Testing and reliability belong in the work.</span></div></div>
          <div className="home-hero-actions"><CvLink /><a className="folio-button folio-button-light" href={site.github} target="_blank" rel="noreferrer">GitHub profile <ArrowUpRight size={15} aria-hidden="true" /></a><Link className="folio-link" href="/experience">Explore my experience <ArrowRight size={15} aria-hidden="true" /></Link></div>
        </div>
      </div></section>
    </main>
  );
}
