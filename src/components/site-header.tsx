"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/projects", label: "Projects" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function closeMenu() { setOpen(false); }

  return (
    <header className="folio-header">
      <div className="folio-shell folio-header-inner">
        <Link href="/" className="folio-brand" aria-label="Katiso Ntseare home" onClick={closeMenu}>
          <span className="folio-brand-mark" aria-hidden="true">K<span>.</span></span>
          <span>KATISO NTSEARE</span>
        </Link>
        <nav id="primary-navigation" className={`folio-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined} onClick={closeMenu}>
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className="folio-nav-contact" aria-current={pathname === "/contact" ? "page" : undefined} onClick={closeMenu}>
            Contact
          </Link>
        </nav>
        <button
          className="folio-menu"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="primary-navigation"
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
