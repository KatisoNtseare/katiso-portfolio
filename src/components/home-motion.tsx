"use client";

import { useEffect } from "react";

export function HomeMotion() {
  useEffect(() => {
    let cancelled = false;
    let revert = () => {};

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, scrollTriggerModule]) => {
      if (cancelled) return;

      const gsap = gsapModule.gsap;
      gsap.registerPlugin(scrollTriggerModule.ScrollTrigger);

      const page = document.querySelector<HTMLElement>(".home-page");
      if (!page) return;

      const context = gsap.context(() => {
        const media = gsap.matchMedia();
        media.add("(prefers-reduced-motion: no-preference)", () => {
          gsap.from(".home-hero-copy > *", {
            y: 14,
            duration: 0.65,
            stagger: 0.08,
            ease: "power2.out",
          });
          gsap.from(".home-portrait", {
            y: 14,
            duration: 0.75,
            delay: 0.12,
            ease: "power2.out",
          });

          gsap.utils.toArray<HTMLElement>("[data-gsap-reveal]").forEach((element) => {
            gsap.from(element, {
              y: 16,
              duration: 0.55,
              ease: "power2.out",
              scrollTrigger: {
                trigger: element,
                start: "top 90%",
                once: true,
              },
            });
          });
        });

        return () => media.revert();
      }, page);

      revert = () => context.revert();
    }).catch(() => {
      // Motion is progressive enhancement; content remains visible without GSAP.
    });

    return () => {
      cancelled = true;
      revert();
    };
  }, []);

  return null;
}
