import { MongoClient } from "mongodb";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const uri = process.env.MONGODB_URI?.trim();
if (!uri) {
  console.error("MONGODB_URI is missing. Add it to .env.local first.");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const database = client.db(process.env.MONGODB_DB?.trim() || "katiso_portfolio");
  const projects = database.collection("projects");

  await projects.createIndex({ slug: 1 }, { unique: true, name: "uq_projects_slug" });
  await projects.createIndex(
    { isPublished: 1, isFeatured: -1, sortOrder: 1, updatedAt: -1 },
    { name: "ix_projects_public_order" },
  );

  const existingCount = await projects.countDocuments();
  if (existingCount > 0) {
    console.log(`Seed skipped: ${existingCount} project record(s) already exist.`);
    console.log("No existing records were changed.");
  } else {
    const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
    const seedPath = path.resolve(scriptDirectory, "../data/seed-projects.json");
    const seedProjects = JSON.parse(await readFile(seedPath, "utf8"));
    const now = new Date().toISOString();
    const documents = seedProjects.map((project) => ({
      ...project,
      createdAt: now,
      updatedAt: now,
    }));
    const result = await projects.insertMany(documents);
    console.log(`Seed complete: ${result.insertedCount} unpublished draft project(s) added.`);
  }

  console.log(`Database: ${database.databaseName}`);
} catch (error) {
  console.error("MongoDB seed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.close();
}
