import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <section className="folio-page-hero">
        <div className="k-shell">
          <p className="k-label" style={{ marginBottom: 24 }}>404 · Page not found</p>
          <h1 className="k-display">This page isn’t where it should be.</h1>
          <p>The page may have moved or the address may be incorrect.</p>
          <div className="k-actions" style={{ marginTop: 32 }}>
            <Link className="k-btn" href="/">Return home</Link>
            <Link className="k-btn k-btn-ghost" href="/projects">Explore projects</Link>
          </div>
        </div>
      </section>
    </main>
  );
}