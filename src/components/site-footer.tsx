import Link from "next/link";
import { ArrowUpRight, Github, Linkedin } from "lucide-react";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-top">
        <div>
          <Link href="/" className="brand footer-brand"><span className="brand-mark">K<span>.</span></span><span className="brand-name">KATISO NTSEARE</span></Link>
          <p className="footer-note">Building thoughtful software for real-world problems.</p>
        </div>
        <div className="footer-links">
          <Link href="/projects">Projects</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><a href={site.proit} target="_blank" rel="noreferrer">ProIT Solutions <ArrowUpRight size={13} /></a>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Katiso Ntseare. All rights reserved.</span>
        <div className="social-links"><a href={site.github} aria-label="GitHub" target="_blank" rel="noreferrer"><Github size={17} /></a>{site.linkedin ? <a href={site.linkedin} aria-label="LinkedIn" target="_blank" rel="noreferrer"><Linkedin size={17} /></a> : null}<Link href="/admin/login" className="admin-entry">Admin</Link></div>
      </div>
    </footer>
  );
}
