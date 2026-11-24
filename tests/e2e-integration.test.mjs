import test from "node:test";
import assert from "node:assert/strict";
import { MongoClient, ObjectId } from "mongodb";
import { v2 as cloudinary } from "cloudinary";

// 1x1 valid PNG buffer
const valid1x1Png = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

const CLOUDINARY_PROJECT_FOLDER = "katiso-portfolio/project-pictures";

test("Live Cloudinary & MongoDB Controlled Integration Test", async (t) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (!cloudName || !apiKey || !apiSecret || !mongoUri) {
    t.skip("Cloudinary or MongoDB credentials not configured; skipping live E2E test.");
    return;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 10000 });
  await mongoClient.connect();
  const db = mongoClient.db(process.env.MONGODB_DB?.trim() || "katiso_portfolio");
  const collection = db.collection("projects");

  let uploadedPublicId = null;
  let mongoDocId = null;

  // Cleanup block ensuring no orphan assets remain even if test fails
  t.after(async () => {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, { invalidate: true });
        console.log(`[TEST CLEANUP] Deleted Cloudinary test asset: ${uploadedPublicId}`);
      } catch (err) {
        console.error(`[TEST CLEANUP ERROR] Failed to clean up Cloudinary asset:`, err);
      }
    }
    if (mongoDocId) {
      try {
        await collection.deleteOne({ _id: new ObjectId(mongoDocId) });
        console.log(`[TEST CLEANUP] Deleted MongoDB test document: ${mongoDocId}`);
      } catch (err) {
        console.error(`[TEST CLEANUP ERROR] Failed to clean up MongoDB doc:`, err);
      }
    }
    await mongoClient.close();
  });

  await t.test("1. Upload temporary test image to Cloudinary under katiso-portfolio/project-pictures", async () => {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: CLOUDINARY_PROJECT_FOLDER,
          resource_type: "image",
          tags: ["automated-test", "temporary"],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(valid1x1Png);
    });

    assert.ok(uploadResult);
    assert.ok(uploadResult.public_id);
    assert.ok(
      uploadResult.public_id.startsWith(CLOUDINARY_PROJECT_FOLDER),
      `Public ID must be inside ${CLOUDINARY_PROJECT_FOLDER}, got: ${uploadResult.public_id}`
    );
    assert.ok(uploadResult.secure_url.startsWith("https://"));
    assert.equal(uploadResult.format, "png");
    assert.equal(uploadResult.width, 1);
    assert.equal(uploadResult.height, 1);

    uploadedPublicId = uploadResult.public_id;
  });

  await t.test("2. Persist project in MongoDB with Cloudinary metadata", async () => {
    const now = new Date().toISOString();
    const testDoc = {
      _id: new ObjectId(),
      title: "Live E2E Integration Project",
      slug: `live-e2e-${Date.now()}`,
      summary: "Temporary integration test project to verify Cloudinary and MongoDB persistence.",
      description: "Detailed description of integration test project.",
      category: "Software Development",
      year: "2026",
      role: "System Tester",
      problem: "E2E testing",
      solution: "Live asset upload and verification",
      contributions: "Automated test script",
      architecture: "Cloudinary + MongoDB",
      architectureFlow: ["Test", "Cloudinary", "MongoDB"],
      challenges: "None",
      outcomes: "Verified",
      technologies: ["Node.js", "Cloudinary", "MongoDB"],
      coverImage: `https://res.cloudinary.com/${cloudName}/image/upload/${uploadedPublicId}.png`,
      image: {
        secureUrl: `https://res.cloudinary.com/${cloudName}/image/upload/${uploadedPublicId}.png`,
        publicId: uploadedPublicId,
        altText: "Live test picture",
        width: 1,
        height: 1,
        format: "png",
      },
      altText: "Live test picture",
      liveUrl: "",
      demoUrl: "",
      repoUrl: "",
      isFeatured: false,
      isPublished: false,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await collection.insertOne(testDoc);
    assert.ok(insertResult.insertedId);
    mongoDocId = insertResult.insertedId.toHexString();

    const retrieved = await collection.findOne({ _id: insertResult.insertedId });
    assert.ok(retrieved);
    assert.equal(retrieved.image.publicId, uploadedPublicId);
    assert.ok(retrieved.image.secureUrl);
  });

  await t.test("3. Clean up Cloudinary asset and delete MongoDB document", async () => {
    // Delete MongoDB document
    const delResult = await collection.deleteOne({ _id: new ObjectId(mongoDocId) });
    assert.equal(delResult.deletedCount, 1);
    mongoDocId = null;

    // Delete Cloudinary asset
    const destroyResult = await cloudinary.uploader.destroy(uploadedPublicId, { invalidate: true });
    assert.ok(
      destroyResult.result === "ok" || destroyResult.result === "not found",
      `Expected ok or not found, got ${destroyResult.result}`
    );
    uploadedPublicId = null;
  });
});
