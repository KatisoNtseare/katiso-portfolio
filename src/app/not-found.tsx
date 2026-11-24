import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-hero">
      <div className="shell">
        <span className="eyebrow">404 / PAGE NOT FOUND</span>
        <h1>This page isn&apos;t<br />where it should be.</h1>
        <p>The page may have moved or the address may be incorrect.</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/">Return home</Link>
          <Link className="button button-secondary" href="/projects">Explore projects</Link>
        </div>
      </div>
    </main>
  );
}
