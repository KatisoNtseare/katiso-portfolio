"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

const links = [
  { href: "/#expertise", label: "Expertise" },
  { href: "/projects", label: "Projects" },
  { href: "/experience", label: "Experience" },
  { href: "/about", label: "About" },
  { href: "/#proit", label: "ProIT" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="Katiso Ntseare home" onClick={() => setOpen(false)}>
          <span className="brand-mark">K<span>.</span></span>
          <span className="brand-name">KATISO NTSEARE</span>
        </Link>
        <nav className={`main-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">
          {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}
          <Link href="/contact" className="nav-contact" onClick={() => setOpen(false)}>Let's talk <ArrowUpRight size={15} /></Link>
        </nav>
        <button className="mobile-menu" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
    </header>
  );
}
