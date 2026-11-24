"use client";
import { useEffect } from "react";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="portfolio-page folio-content"><div className="folio-shell folio-page-hero-grid"><div><span className="folio-kicker">Something went wrong</span><h1 className="folio-display">The page hit an unexpected issue.</h1><p>Please try again. If the problem continues, come back in a little while.</p><div className="home-hero-actions"><button className="folio-button" onClick={reset}>Try again</button></div></div></div></main>;
}
