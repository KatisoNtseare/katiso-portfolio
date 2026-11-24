import Link from "next/link";
import { ArrowUpRight, Github, Linkedin } from "lucide-react";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="folio-footer">
      <div className="folio-shell">
        <div className="folio-footer-top">
          <div>
            <Link href="/" className="folio-brand"><span className="folio-brand-mark" aria-hidden="true">K<span>.</span></span><span>KATISO NTSEARE</span></Link>
            <p className="folio-footer-description">Software development grounded in useful outcomes.</p>
          </div>
          <nav className="folio-footer-links" aria-label="Footer navigation">
            <Link href="/projects">Projects</Link>
            <Link href="/experience">Experience</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <a href={site.proit} target="_blank" rel="noreferrer">ProIT Solutions <ArrowUpRight size={13} aria-hidden="true" /></a>
          </nav>
        </div>
        <div className="folio-footer-bottom">
          <span>© {new Date().getFullYear()} Katiso Ntseare</span>
          <div className="folio-footer-social">
            <a href={site.github} aria-label="GitHub profile" target="_blank" rel="noreferrer"><Github size={17} /></a>
            {site.linkedin ? <a href={site.linkedin} aria-label="LinkedIn profile" target="_blank" rel="noreferrer"><Linkedin size={17} /></a> : null}
            <Link href="/admin/login">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
