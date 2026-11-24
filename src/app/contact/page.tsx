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
    <main>
      <section className="folio-page-hero">
        <div className="k-shell">
          <h1 className="k-display">What are you trying to solve?</h1>
          <p>Share the context, the challenge and what a useful outcome would look like. I’m open to engineering opportunities, collaborations and practical technology projects.</p>
        </div>
      </section>
      <section className="folio-content">
        <div className="k-shell k-contact">
          <aside>
            <h2 className="k-display">Good work begins with a useful conversation.</h2>
            <p>The message can be as brief or as detailed as you need. The enquiry type helps me understand what you have in mind.</p>
            <div className="k-contact-links">
              <a href={site.github} target="_blank" rel="noreferrer"><Github size={17} aria-hidden="true" /> GitHub <ArrowUpRight size={14} aria-hidden="true" /></a>
              {site.linkedin ? <a href={site.linkedin} target="_blank" rel="noreferrer"><Linkedin size={17} aria-hidden="true" /> LinkedIn <ArrowUpRight size={14} aria-hidden="true" /></a> : null}
              <a href={site.proit} target="_blank" rel="noreferrer"><Send size={16} aria-hidden="true" /> ProIT Solutions <ArrowUpRight size={14} aria-hidden="true" /></a>
            </div>
          </aside>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}