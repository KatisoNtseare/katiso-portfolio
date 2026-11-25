"use client";

import { useEffect } from "react";

// Quiet reveal-on-scroll. Content stays visible without JS or with reduced motion.
export function HomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".public-site");
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!root || !items.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    root.classList.add("reveal-ready");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}