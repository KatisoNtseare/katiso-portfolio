export const site = {
  name: "Katiso Ntseare",
  title: "Software Developer",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://katiso.proit.dev",
  description: "IT professional and software developer building full-stack applications, secure APIs and practical cloud systems.",
  github: "https://github.com/KatisoNtseare",
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "https://www.linkedin.com/search/results/people/?keywords=Katiso%20Ntseare",
  email: "katisontseare@outlook.com",
  phone: "063 359 9308",
  location: "Johannesburg / Gqeberha, South Africa",
  proit: "https://proit.dev",
  managedCloud: "https://www.cloud.proit.dev/",
};

export const expertise = [
  { title: "Backend development", description: "APIs, application services, authentication and business logic.", items: ["C#", "ASP.NET Core", "Python", "FastAPI", "REST APIs"] },
  { title: "Frontend development", description: "Responsive interfaces and structured component-driven applications.", items: ["Next.js", "React", "TypeScript", "JavaScript", "HTML & CSS"] },
  { title: "Data & persistence", description: "Relational data modelling, queries and application persistence.", items: ["SQL Server", "PostgreSQL", "MongoDB", "T-SQL", "Database design"] },
  { title: "Cloud & delivery", description: "Deployment, source control, automation and application operations.", items: ["Docker", "Linux", "IIS", "Cloudflare", "CI/CD"] },
  { title: "Systems & security", description: "Designing maintainable systems with attention to access and security boundaries.", items: ["System architecture", "RBAC", "API security", "Testing", "Automation"] },
];
