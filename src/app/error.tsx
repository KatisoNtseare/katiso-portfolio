"use client";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main>
      <section className="folio-page-hero">
        <div className="k-shell">
          <p className="k-label" style={{ marginBottom: 24 }}>Something went wrong</p>
          <h1 className="k-display">The page hit an unexpected issue.</h1>
          <p>Please try again. If the problem continues, come back in a little while.</p>
          <div className="k-actions" style={{ marginTop: 32 }}>
            <button className="k-btn" onClick={reset}>Try again</button>
          </div>
        </div>
      </section>
    </main>
  );
}