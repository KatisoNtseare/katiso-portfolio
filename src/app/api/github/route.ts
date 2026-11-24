import { NextResponse } from "next/server";

export const revalidate = 3600;
export async function GET() {
  const username = process.env.GITHUB_USERNAME || "KatisoNtseare";
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const [profileResponse, reposResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers, next: { revalidate: 3600 } }),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=8&type=public`, { headers, next: { revalidate: 3600 } }),
    ]);
    if (!profileResponse.ok || !reposResponse.ok) return NextResponse.json({ message: "GitHub API is temporarily unavailable." }, { status: 502 });
    const profile = await profileResponse.json();
    const repositories = await reposResponse.json();
    return NextResponse.json({
      profile: { login: profile.login, public_repos: profile.public_repos, followers: profile.followers, html_url: profile.html_url },
      repositories: repositories.filter((repo: { fork: boolean; archived: boolean }) => !repo.fork && !repo.archived).slice(0, 6).map((repo: Record<string, unknown>) => ({
        id: repo.id, name: repo.name, description: repo.description, html_url: repo.html_url,
        stargazers_count: repo.stargazers_count, forks_count: repo.forks_count, language: repo.language, updated_at: repo.updated_at,
      })),
    }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ message: "Unable to reach GitHub." }, { status: 502 });
  }
}
