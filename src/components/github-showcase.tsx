"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/lib/site";

type Repository = { id: number; name: string; description: string | null; html_url: string; stargazers_count: number; forks_count: number; language: string | null; updated_at: string };
type GithubData = { profile: { login: string; public_repos: number; followers: number; html_url: string }; repositories: Repository[] };

export function GithubShowcase() {
  const [data, setData] = useState<GithubData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/github")
      .then(async (response) => {
        if (!response.ok) throw new Error("GitHub data is unavailable");
        return response.json() as Promise<GithubData>;
      })
      .then((result) => { if (active) setData(result); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div>
      <div className="k-repo-bar">
        <span>{data ? `${data.profile.public_repos} public repositories · ${data.profile.followers} followers` : "github.com/KatisoNtseare"}</span>
        <a className="k-link" href={site.github} target="_blank" rel="noreferrer">View profile <ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
      {loading ? <div role="status" aria-live="polite"><span className="sr-only">Loading public GitHub repositories</span><div className="k-skeleton" /><div className="k-skeleton" /><div className="k-skeleton" /></div> : null}
      {error ? <p className="k-muted" role="status">Repository data could not be loaded right now. The GitHub profile is still available above.</p> : null}
      {data ? (
        <ul className="k-repos">
          {data.repositories.slice(0, 6).map((repo) => (
            <li key={repo.id}>
              <a className="k-repo" href={repo.html_url} target="_blank" rel="noreferrer">
                <span className="k-repo-name">{repo.name}</span>
                <span className="k-repo-desc">{repo.description || "No description provided."}</span>
                <span className="k-repo-meta">{repo.language || "Mixed"}{repo.stargazers_count > 0 ? ` · ★ ${repo.stargazers_count}` : ""}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}