"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, GitFork, Github, Star } from "lucide-react";

type Repository = { id: number; name: string; description: string | null; html_url: string; stargazers_count: number; forks_count: number; language: string | null; updated_at: string };
type GithubData = { profile: { login: string; public_repos: number; followers: number; html_url: string }; repositories: Repository[] };

export function GithubShowcase() {
  const [data, setData] = useState<GithubData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/github").then(async (response) => {
      if (!response.ok) throw new Error("GitHub data is unavailable");
      return response.json() as Promise<GithubData>;
    }).then((result) => { if (active) setData(result); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className="github-panel">
    <div className="github-profile-row"><div className="github-icon"><Github size={24} /></div><div><strong>github.com/KatisoNtseare</strong><span>Selected public repositories and development activity</span></div><a href="https://github.com/KatisoNtseare" target="_blank" rel="noreferrer" className="text-link">View profile <ArrowUpRight size={15} /></a></div>
    {loading ? <div className="github-state github-loading" role="status" aria-live="polite"><span className="sr-only">Loading public GitHub repositories</span><span className="github-skeleton-line" /><span className="github-skeleton-line" /><span className="github-skeleton-line" /></div> : null}
    {error ? <div className="github-state" role="status">GitHub data could not be loaded right now. Visit the profile directly to explore the repositories.</div> : null}
    {data ? <>
      <div className="github-stats"><div><strong>{data.profile.public_repos}</strong><span>Public repositories</span></div><div><strong>{data.profile.followers}</strong><span>Followers</span></div><div><strong>{data.repositories.length}</strong><span>Repositories shown</span></div></div>
      <div className="repo-grid">{data.repositories.slice(0, 6).map((repo) => <a className="repo-card" href={repo.html_url} target="_blank" rel="noreferrer" key={repo.id}><div className="repo-title"><Github size={16} /><strong>{repo.name}</strong><ArrowUpRight size={14} /></div><p>{repo.description || "No repository description provided."}</p><div className="repo-meta"><span>{repo.language || "Multiple languages"}</span><span><Star size={13} /> {repo.stargazers_count}</span><span><GitFork size={13} /> {repo.forks_count}</span></div></a>)}</div>
    </> : null}
  </div>;
}
