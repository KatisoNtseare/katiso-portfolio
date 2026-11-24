import { MongoClient } from "mongodb";

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

  const [count, indexes] = await Promise.all([
    projects.countDocuments(),
    projects.listIndexes().toArray(),
  ]);

  console.log(`MongoDB connection: OK`);
  console.log(`Database: ${database.databaseName}`);
  console.log(`Collection: projects`);
  console.log(`Project records: ${count}`);
  console.log(`Indexes: ${indexes.map((index) => index.name).join(", ")}`);
} catch (error) {
  console.error("MongoDB check failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.close();
}
