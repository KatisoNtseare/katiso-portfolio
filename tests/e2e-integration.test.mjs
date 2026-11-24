import test from "node:test";
import assert from "node:assert/strict";

const TEST_DATABASE = "katiso_portfolio_test";
const validPng = Buffer.from([
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

test("Live application integration with isolated MongoDB and Cloudinary test credentials", async (t) => {
  const mongoUri = process.env.MONGODB_TEST_URI?.trim();
  const databaseName = process.env.MONGODB_TEST_DB?.trim();
  const cloudName = process.env.CLOUDINARY_TEST_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_TEST_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_TEST_API_SECRET?.trim();

  if (!mongoUri || !databaseName || !cloudName || !apiKey || !apiSecret) {
    t.skip("Requires MONGODB_TEST_URI, MONGODB_TEST_DB=katiso_portfolio_test, and CLOUDINARY_TEST_* credentials; live services were not used.");
    return;
  }
  assert.equal(databaseName, TEST_DATABASE, "Live integration tests are restricted to the dedicated test database.");

  process.env.MONGODB_URI = mongoUri;
  process.env.MONGODB_DB = databaseName;
  process.env.CLOUDINARY_CLOUD_NAME = cloudName;
  process.env.CLOUDINARY_API_KEY = apiKey;
  process.env.CLOUDINARY_API_SECRET = apiSecret;

  const [db, cloudinary, cleanup] = await Promise.all([
    import("../src/lib/db.ts"),
    import("../src/lib/cloudinary.ts"),
    import("../src/lib/asset-cleanup.ts"),
  ]);
  const slug = `live-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const uploaded = [];
  let projectId;

  t.after(async () => {
    const cleanupErrors = [];
    try {
      if (projectId) await db.deleteProject(projectId);
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      if (uploaded.length) await cleanup.cleanupUnreferencedProjectImages(uploaded.map((item) => item.publicId));
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      await db.closeMongoConnection();
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (cleanupErrors.length) throw new AggregateError(cleanupErrors, "Live integration test cleanup failed.");
  });

  await t.test("uploads multiple real images using the production Cloudinary helper", async () => {
    uploaded.push(await cloudinary.uploadProjectImageToCloudinary(validPng, { altText: "Test cover" }));
    uploaded.push(await cloudinary.uploadProjectImageToCloudinary(validPng, { altText: "Test secondary" }));
    assert.equal(uploaded.length, 2);
    assert.ok(uploaded.every((item) => cloudinary.isProjectImagePublicId(item.publicId)));
    assert.ok(uploaded.every((item) => item.secureUrl.startsWith("https://")));
  });

  await t.test("persists, publishes, selects a primary and protects referenced assets", async () => {
    const media = uploaded.map((image, index) => ({
      id: `live-${index}`,
      type: "image",
      secureUrl: image.secureUrl,
      publicId: image.publicId,
      altText: image.altText || "Live integration image",
      width: image.width,
      height: image.height,
      format: image.format,
      displayOrder: index + 1,
      isPrimary: index === 0,
    }));
    const input = {
      title: "Live integration project",
      slug,
      summary: "Temporary live integration data in the test database.",
      description: "Live service verification.",
      category: "Integration test",
      year: "2026",
      role: "Automated test",
      problem: "Check app persistence",
      solution: "Isolated integration environment",
      contributions: "Automated",
      architecture: "Next.js, MongoDB and Cloudinary",
      architectureFlow: ["Upload", "Persist", "Publish"],
      challenges: "None",
      outcomes: "Verified",
      technologies: ["Next.js", "MongoDB", "Cloudinary"],
      coverImage: media[0].secureUrl,
      image: undefined,
      altText: media[0].altText,
      media,
      liveUrl: "",
      demoUrl: "",
      repoUrl: "",
      isFeatured: false,
      isPublished: false,
      sortOrder: 0,
    };
    const created = await db.createProject(input);
    projectId = created.id;
    assert.equal((await db.getProjectBySlug(slug)).media.length, 2);
    assert.equal((await db.getProjects()).some((item) => item.id === projectId), false);

    input.isPublished = true;
    input.media = media.map((item) => ({ ...item, isPrimary: item.id === "live-1" }));
    const updated = await db.updateProject(projectId, input);
    assert.equal(updated.image.publicId, uploaded[1].publicId);
    assert.equal((await db.getProjects()).some((item) => item.id === projectId), true);
    assert.equal(await db.isProjectImageReferenced(uploaded[1].publicId), true);

    await cleanup.cleanupUnreferencedProjectImages([uploaded[1].publicId]);
    assert.equal(await db.isProjectImageReferenced(uploaded[1].publicId), true);

    assert.equal(await db.deleteProject(projectId), true);
    projectId = undefined;
    const { getPendingCloudinaryCleanup } = db;
    await cleanup.cleanupUnreferencedProjectImages(uploaded.map((item) => item.publicId), {
      deleteImage: async (publicId) => publicId === uploaded[0].publicId
        ? false
        : cloudinary.deleteProjectImageFromCloudinary(publicId),
    });
    assert.ok((await getPendingCloudinaryCleanup()).some((item) => item._id === uploaded[0].publicId), "a failed deletion is persisted for retry");
    await cleanup.cleanupUnreferencedProjectImages([uploaded[0].publicId]);
    assert.equal((await getPendingCloudinaryCleanup()).some((item) => item._id === uploaded[0].publicId), false, "the real Cloudinary retry clears the cleanup record");
    assert.equal(await db.isProjectImageReferenced(uploaded[1].publicId), false);
  });
});
