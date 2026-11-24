import Link from "next/link";
import { ArrowUpRight, Github, Linkedin } from "lucide-react";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="k-footer">
      <div className="k-shell">
        <div className="k-footer-top">
          <div>
            <Link href="/" className="k-wordmark">Katiso Ntseare</Link>
            <p>Software development grounded in useful outcomes.</p>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/projects">Projects</Link>
            <Link href="/experience">Experience</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <a href={site.proit} target="_blank" rel="noreferrer">ProIT Solutions <ArrowUpRight size={13} aria-hidden="true" /></a>
          </nav>
        </div>
        <div className="k-footer-bottom">
          <span>© {new Date().getFullYear()} Katiso Ntseare</span>
          <div className="k-footer-social">
            <a href={site.github} aria-label="GitHub profile" target="_blank" rel="noreferrer"><Github size={17} /></a>
            {site.linkedin ? <a href={site.linkedin} aria-label="LinkedIn profile" target="_blank" rel="noreferrer"><Linkedin size={17} /></a> : null}
            <Link href="/admin/login">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}