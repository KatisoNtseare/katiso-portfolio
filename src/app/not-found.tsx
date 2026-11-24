import Link from "next/link";

export default function NotFound() {
  return (
    <main className="portfolio-page folio-content">
      <div className="folio-shell folio-page-hero-grid">
        <div><span className="folio-kicker">404 · Page not found</span>
        <h1 className="folio-display">This page isn&apos;t where it should be.</h1>
        <p>The page may have moved or the address may be incorrect.</p>
        <div className="home-hero-actions">
          <Link className="folio-button" href="/">Return home</Link>
          <Link className="folio-button folio-button-light" href="/projects">Explore projects</Link>
        </div>
        </div>
      </div>
    </main>
  );
}
