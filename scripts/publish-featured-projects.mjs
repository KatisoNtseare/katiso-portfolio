import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();
if (!uri) {
  console.error("MONGODB_URI is missing. Add it to .env.local first.");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const database = client.db(process.env.MONGODB_DB?.trim() || "KatisoPortfolioDb");
  const projects = database.collection("projects");
  const now = new Date().toISOString();

  const featuredProjects = [
    {
      title: "Luminar Learning",
      slug: "luminar-learning",
      summary: "A multi-service learning and tutoring platform with role-based workflows, secure application services and integrated document processing.",
      description: "University final-year project connecting learners, tutors and academies through role-specific applications and protected backend workflows.",
      category: "Education Technology",
      year: "2026",
      role: "University final-year project",
      problem: "Learning services need to coordinate student, tutor and academy activity while maintaining clear access boundaries and reliable booking, payment and document workflows.",
      solution: "A multi-service platform combining a Next.js frontend, ASP.NET Core Web API, SQL Server/EF Core data layer and Python FastAPI document service.",
      contributions: "Architected application boundaries and integrated authentication, protected API flows, data persistence, document processing, payment callbacks and deployment configuration.",
      architecture: "A Next.js browser application communicates with an ASP.NET Core Web API and SQL Server data layer. A separate Python FastAPI service handles document processing, with environment configuration and production routing prepared for deployment.",
      architectureFlow: ["Next.js frontend", "ASP.NET Core API", "SQL Server / EF Core", "Python FastAPI"],
      challenges: "Coordinating multiple services required deliberate CORS, authentication, secure-cookie, environment, routing and callback decisions across frontend and backend boundaries.",
      outcomes: "Delivered a working role-based platform concept with protected application flows, learning workflows, booking support and a documented deployment architecture.",
      technologies: ["ASP.NET Core", "Next.js", "TypeScript", "SQL Server", "EF Core", "FastAPI"],
      coverImage: "",
      liveUrl: "",
      demoUrl: "",
      repoUrl: "",
      isFeatured: true,
      isPublished: true,
      publishedAt: now,
      sortOrder: 1,
    },
    {
      title: "Affinity Voting Platform",
      slug: "affinity-voting-platform",
      summary: "A student voting platform for residences and buildings with role-based administration and configurable voting categories.",
      description: "A public-facing voting system supporting residence and building selection, category configuration and controlled voting workflows.",
      category: "Student Voting System",
      year: "2025",
      role: "Software project",
      problem: "Student voting requires clear eligibility boundaries, residence or building context, configurable categories and reliable prevention of duplicate category votes.",
      solution: "A role-based Next.js application with administrative workflows, category configuration and one-vote-per-category enforcement.",
      contributions: "Implemented application workflows and supported deployment, security-origin configuration and production troubleshooting for the public-facing platform.",
      architecture: "A Next.js application provides voter and administrative interfaces with server-side application logic and persistent voting and configuration records.",
      architectureFlow: ["Voter interface", "Next.js application", "Voting rules", "Persistent records"],
      challenges: "Maintaining consistent voting rules across user roles while configuring permitted origins and diagnosing public deployment behaviour.",
      outcomes: "Delivered a role-based voting platform concept covering residence selection, categories, ballot administration and controlled vote submission.",
      technologies: ["Next.js", "React", "TypeScript", "Role-based access", "Deployment security"],
      coverImage: "",
      liveUrl: "",
      demoUrl: "",
      repoUrl: "",
      isFeatured: true,
      isPublished: true,
      publishedAt: now,
      sortOrder: 2,
    },
  ];

  for (const project of featuredProjects) {
    await projects.updateOne(
      { slug: project.slug },
      {
        $set: { ...project, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  }

  console.log("Published Luminar Learning and Affinity Voting Platform case studies.");
} finally {
  await client.close();
}
