export const site = {
  name: "Katiso Ntseare",
  title: "Software Developer",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://katiso.proit.dev",
  description: "Software Developer focused on building practical software, backend systems and thoughtful digital experiences.",
  github: "https://github.com/KatisoNtseare",
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "",
  proit: "https://proit.dev",
};

export const expertise = [
  { title: "Backend development", description: "APIs, application services, authentication and business logic.", items: ["C#", "ASP.NET Core", "Python", "FastAPI", "REST APIs"] },
  { title: "Frontend development", description: "Responsive interfaces and structured component-driven applications.", items: ["Next.js", "React", "TypeScript", "JavaScript", "HTML & CSS"] },
  { title: "Data & persistence", description: "Relational data modelling, queries and application persistence.", items: ["SQL Server", "PostgreSQL", "MongoDB", "T-SQL", "Database design"] },
  { title: "Cloud & delivery", description: "Deployment, source control, automation and application operations.", items: ["Git", "GitHub Actions", "Oracle Cloud", "Cloudflare", "CI/CD"] },
  { title: "Systems & security", description: "Designing maintainable systems with attention to access and security boundaries.", items: ["System architecture", "RBAC", "API security", "Testing", "Automation"] },
];
