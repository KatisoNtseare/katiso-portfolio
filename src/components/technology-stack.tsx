import Image from "next/image";

const technologyGroups = [
  {
    title: "Application development",
    technologies: [
      { name: "C#", icon: "Csharp.svg" },
      { name: ".NET", icon: "NETCore.svg" },
      { name: "Python", icon: "python-svgrepo-com.svg" },
      { name: "FastAPI", icon: "fastapi-svgrepo-com.svg" },
      { name: "TypeScript", icon: "typescript-svgrepo-com.svg" },
      { name: "JavaScript", icon: "javascript-svgrepo-com.svg" },
      { name: "Next.js", icon: "Nextjs.svg" },
      { name: "React", icon: "React.svg" },
      { name: "Node.js", icon: "Nodejs.svg" },
      { name: "Express", icon: "Express.svg" },
      { name: "Tailwind CSS", icon: "Tailwind.svg" },
    ],
  },
  {
    title: "Cloud and operations",
    technologies: [
      { name: "Azure", icon: "Azure.svg" },
      { name: "Oracle Cloud", icon: "oracle-svgrepo-com.svg" },
      { name: "Cloudflare", icon: "Cloudflare.svg" },
      { name: "Docker", icon: "Docker.svg" },
      { name: "GitHub Actions", icon: "github-svgrepo-com.svg" },
      { name: "Linux", icon: "Linux.svg" },
      { name: "Ubuntu", icon: "Ubuntu.svg" },
    ],
  },
  {
    title: "Data and persistence",
    technologies: [
      { name: "Azure SQL", icon: "AzureSQLDatabase.svg" },
      { name: "SQL Server", icon: "microsoft-sql-server-logo-svgrepo-com.svg" },
      { name: "PostgreSQL", icon: "postgresql-svgrepo-com.svg" },
      { name: "MongoDB", icon: "mongodb-logo-svgrepo-com.svg" },
    ],
  },
];

export function TechnologyStack() {
  return (
    <div className="technology-groups">
      {technologyGroups.map((group) => (
        <section className="technology-group" key={group.title} aria-label={group.title}>
          <h3>{group.title}</h3>
          <ul className="technology-grid">
            {group.technologies.map((technology) => (
              <li className="technology-item" data-gsap-reveal key={technology.name}>
                <span className="technology-icon-well" aria-hidden="true">
                  <Image
                    src={`/images/tech/${technology.icon}`}
                    alt=""
                    width={38}
                    height={38}
                    unoptimized
                  />
                </span>
                <span>{technology.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
