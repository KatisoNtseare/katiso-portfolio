import test from "node:test";
import assert from "node:assert/strict";
import { MongoClient, ObjectId } from "mongodb";

test("MongoDB CRUD & Publishing Verification", async (t) => {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    t.skip("MONGODB_URI is not configured in .env.local; skipping DB integration test.");
    return;
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB?.trim() || "katiso_portfolio");
  const collection = db.collection("projects");

  const testSlug = `test-crud-project-${Date.now()}`;
  let createdId = null;

  t.after(async () => {
    if (createdId) {
      await collection.deleteOne({ _id: new ObjectId(createdId) });
    }
    await client.close();
  });

  await t.test("Create a new draft project with MongoDB ObjectId and timestamps", async () => {
    const now = new Date().toISOString();
    const doc = {
      _id: new ObjectId(),
      title: "Automated Test Project",
      slug: testSlug,
      summary: "This is a test summary for verifying MongoDB CRUD operations.",
      description: "Full description of test project.",
      category: "Software Development",
      year: "2026",
      role: "Test Engineer",
      problem: "Testing CRUD",
      solution: "Automated test suite",
      contributions: "Wrote tests",
      architecture: "Test architecture",
      architectureFlow: ["TestNodeA", "TestNodeB"],
      challenges: "None",
      outcomes: "100% pass",
      technologies: ["TypeScript", "MongoDB", "Node.js"],
      coverImage: "https://res.cloudinary.com/demo/image/upload/katiso-portfolio/project-pictures/test.jpg",
      image: {
        secureUrl: "https://res.cloudinary.com/demo/image/upload/katiso-portfolio/project-pictures/test.jpg",
        publicId: "katiso-portfolio/project-pictures/test",
        altText: "Test cover image",
        width: 1200,
        height: 800,
        format: "jpg",
      },
      altText: "Test cover image",
      liveUrl: "https://example.com/test",
      demoUrl: "",
      repoUrl: "https://github.com/example/test",
      isFeatured: false,
      isPublished: false,
      sortOrder: 99,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc);
    assert.ok(result.insertedId);
    createdId = result.insertedId.toHexString();

    const retrieved = await collection.findOne({ _id: result.insertedId });
    assert.ok(retrieved);
    assert.equal(retrieved.title, "Automated Test Project");
    assert.equal(retrieved.slug, testSlug);
    assert.equal(retrieved.isPublished, false);
    assert.equal(retrieved.image.publicId, "katiso-portfolio/project-pictures/test");
  });

  await t.test("Public query excludes draft projects", async () => {
    const publicProjects = await collection.find({ isPublished: true }).toArray();
    const isTestInPublic = publicProjects.some((p) => p.slug === testSlug);
    assert.equal(isTestInPublic, false, "Draft project must not appear in public query");
  });

  await t.test("Admin query includes draft projects", async () => {
    const allProjects = await collection.find({}).toArray();
    const isTestInAll = allProjects.some((p) => p.slug === testSlug);
    assert.equal(isTestInAll, true, "Draft project must be visible in admin query");
  });

  await t.test("Enforces unique project slug", async () => {
    const duplicateDoc = {
      _id: new ObjectId(),
      title: "Duplicate Slug Project",
      slug: testSlug,
      summary: "Should fail with duplicate key error code 11000",
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await assert.rejects(
      async () => {
        await collection.insertOne(duplicateDoc);
      },
      (err) => err && err.code === 11000,
      "Expected duplicate key error 11000"
    );
  });

  await t.test("Update project fields and publish status", async () => {
    const updatedTime = new Date().toISOString();
    const updateResult = await collection.updateOne(
      { _id: new ObjectId(createdId) },
      {
        $set: {
          title: "Automated Test Project Updated",
          isPublished: true,
          publishedAt: updatedTime,
          updatedAt: updatedTime,
        },
      }
    );
    assert.equal(updateResult.matchedCount, 1);

    const updatedDoc = await collection.findOne({ _id: new ObjectId(createdId) });
    assert.equal(updatedDoc.title, "Automated Test Project Updated");
    assert.equal(updatedDoc.isPublished, true);
    assert.ok(updatedDoc.publishedAt);
  });

  await t.test("Published project appears in public query", async () => {
    const publicProjects = await collection.find({ isPublished: true }).toArray();
    const isTestInPublic = publicProjects.some((p) => p.slug === testSlug);
    assert.equal(isTestInPublic, true, "Published project must appear in public query");
  });

  await t.test("Unpublishing moves project back to private draft without deleting records", async () => {
    const unpublishResult = await collection.updateOne(
      { _id: new ObjectId(createdId) },
      {
        $set: {
          isPublished: false,
          updatedAt: new Date().toISOString(),
        },
      }
    );
    assert.equal(unpublishResult.matchedCount, 1);

    const publicProjects = await collection.find({ isPublished: true }).toArray();
    assert.equal(publicProjects.some((p) => p.slug === testSlug), false);

    // Document still exists in database
    const docStillExists = await collection.findOne({ _id: new ObjectId(createdId) });
    assert.ok(docStillExists, "Unpublished project must still exist in MongoDB");
  });

  await t.test("Delete project removes document from database", async () => {
    const deleteResult = await collection.deleteOne({ _id: new ObjectId(createdId) });
    assert.equal(deleteResult.deletedCount, 1);

    const check = await collection.findOne({ _id: new ObjectId(createdId) });
    assert.equal(check, null);
    createdId = null; // Mark cleaned up
  });
});
