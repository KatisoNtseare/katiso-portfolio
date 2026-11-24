"use client";
import { useEffect } from "react";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="page-hero"><div className="shell"><span className="eyebrow">SOMETHING WENT WRONG</span><h1>The page hit<br />an unexpected issue.</h1><p>Please try again. If the problem continues, come back in a little while.</p><div className="hero-actions"><button className="button button-primary" onClick={reset}>Try again</button></div></div></main>;
}
