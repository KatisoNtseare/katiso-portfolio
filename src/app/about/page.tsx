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
          <p>Backend, frontend, data, infrastructure and people: I build by understanding how the full product fits together and what must remain dependable after launch.</p>
        </div>
      </section>
      <section className="folio-content">
        <div className="k-shell k-about">
          <figure className="k-about-portrait"><Image src="/images/fullPicture.jpg" alt="Katiso Ntseare" fill sizes="(max-width: 900px) 360px, 34vw" /></figure>
          <div className="k-prose">
            <p className="k-lede">I am an IT professional and software developer who turns operational requirements into dependable applications.</p>
            <p>I build full-stack applications, REST APIs, authentication systems and database-driven platforms with C#, ASP.NET Core, Entity Framework Core, SQL Server, Next.js, React, TypeScript and Python FastAPI.</p>
            <p>I enjoy working across the complete product lifecycle: understanding the problem, defining boundaries, modelling data, protecting sensitive workflows and preparing applications for deployment. My academic, tutoring and product-development experience has strengthened both my technical judgement and my ability to explain complex ideas clearly.</p>
            <p>From February 2025 to November 2026, I served as Chairman of GKSS. The role developed my leadership, communication and community-building skills while I supported student engagement and professional development.</p>
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