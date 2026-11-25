import { MongoClient } from "mongodb";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

  const now = new Date().toISOString();

  await projects.deleteMany({
    slug: { $in: ["portfolio-e2e-test", "affinity-student-living", "suburban-digs", "affinity-voting-platform"] },
  });

  const renamedSuburban = await projects.findOne({
    slug: { $in: ["suburban-digs-res-applications", "suburban-digs"] },
  });
  if (renamedSuburban) {
    await projects.updateOne(
      { _id: renamedSuburban._id },
      { $set: { slug: "pro-residance-applications", updatedAt: now } },
    );
  }

  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const seedPath = path.resolve(scriptDirectory, "../data/seed-projects.json");
  const seedProjects = JSON.parse(await readFile(seedPath, "utf8"));

  for (const seedProject of seedProjects) {
    const existing = await projects.findOne({ slug: seedProject.slug });
    await projects.updateOne(
      { slug: seedProject.slug },
      {
        $set: {
          ...seedProject,
          coverImage: "",
          altText: "",
          media: [],
          isInDevelopment: seedProject.isInDevelopment === true,
          updatedAt: now,
          publishedAt: seedProject.isPublished ? (existing?.publishedAt || now) : undefined,
          createdAt: existing?.createdAt || now,
        },
        $unset: { image: "" },
      },
      { upsert: true },
    );
  }

  console.log(`Project stories synced: ${seedProjects.length} records.`);
  console.log(`Database: ${database.databaseName}`);
} catch (error) {
  console.error("Project story sync failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.close();
}
