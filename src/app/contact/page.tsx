import type { Metadata } from "next";
import { ArrowUpRight, Github, Linkedin, Send } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Katiso Ntseare about software engineering opportunities, collaborations and projects.",
};

export default function ContactPage() {
  return (
    <main className="portfolio-page contact-page">
      <section className="folio-page-hero"><div className="folio-shell folio-page-hero-grid"><div><h1 className="folio-display">What are you trying to solve?</h1><p>Share the context, the challenge and what a useful outcome would look like. I&apos;m open to engineering opportunities, collaborations and practical technology projects.</p></div><p className="folio-page-side-note">Software engineering<br />Project collaboration<br />ProIT Solutions</p></div></section>
      <section className="folio-content"><div className="folio-shell contact-layout">
        <aside className="contact-note"><h2 className="folio-display">Good work begins with a useful conversation.</h2><p>Use the form to share a few details. The enquiry type helps me understand what you have in mind, and the message can be as brief or as detailed as you need.</p><div className="contact-note-links"><a href={site.github} target="_blank" rel="noreferrer"><Github size={17} aria-hidden="true" /> GitHub profile <ArrowUpRight size={14} aria-hidden="true" /></a>{site.linkedin ? <a href={site.linkedin} target="_blank" rel="noreferrer"><Linkedin size={17} aria-hidden="true" /> LinkedIn profile <ArrowUpRight size={14} aria-hidden="true" /></a> : null}<a href={site.proit} target="_blank" rel="noreferrer"><Send size={16} aria-hidden="true" /> ProIT Solutions <ArrowUpRight size={14} aria-hidden="true" /></a></div></aside>
        <ContactForm />
      </div></section>
    </main>
  );
}
