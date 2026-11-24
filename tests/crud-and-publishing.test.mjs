import test from "node:test";
import assert from "node:assert/strict";
import { MongoClient } from "mongodb";

const TEST_DATABASE = "katiso_portfolio_test";
const image = (id, isPrimary, displayOrder) => ({
  id,
  type: "image",
  secureUrl: `https://res.cloudinary.com/test/${id}.png`,
  publicId: `katiso-portfolio/project-pictures/${id}`,
  altText: id,
  width: 1,
  height: 1,
  format: "png",
  displayOrder,
  isPrimary,
});

function projectInput(slug) {
  return {
    title: "MongoDB test project",
    slug,
    summary: "A temporary isolated project for CRUD integration testing.",
    description: "Integration test",
    category: "Testing",
    year: "2026",
    role: "Test",
    problem: "Test persistence",
    solution: "Use isolated test DB",
    contributions: "Automated test",
    architecture: "Next.js and MongoDB",
    architectureFlow: ["API", "MongoDB"],
    challenges: "None",
    outcomes: "Verified",
    technologies: ["TypeScript", "MongoDB"],
    coverImage: "",
    altText: "",
    media: [image("integration-cover", true, 1), image("integration-secondary", false, 2)],
    liveUrl: "",
    demoUrl: "",
    repoUrl: "",
    isFeatured: false,
    isPublished: false,
    sortOrder: 0,
  };
}

test("Application MongoDB CRUD, media, publishing and atomic upload claims", async (t) => {
  const uri = process.env.MONGODB_TEST_URI?.trim();
  const databaseName = process.env.MONGODB_TEST_DB?.trim();
  if (!uri || !databaseName) {
    t.skip("Set MONGODB_TEST_URI and MONGODB_TEST_DB=katiso_portfolio_test to run against an isolated MongoDB test database.");
    return;
  }
  assert.equal(databaseName, TEST_DATABASE, "Integration tests are restricted to the dedicated test database.");

  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB = databaseName;
  const {
    claimProjectImageUploads,
    closeMongoConnection,
    createProject,
    deleteProject,
    getProjectById,
    getProjectBySlug,
    getProjects,
    isProjectImageReferenced,
    registerProjectImageUpload,
    slugIsTaken,
    updateProject,
  } = await import("../src/lib/db.ts");
  const { cleanupUnreferencedProjectImages } = await import("../src/lib/asset-cleanup.ts");

  const slug = `integration-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const uploadId = `katiso-portfolio/project-pictures/integration-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  let projectId;
  let otherProjectId;
  const cleanupClient = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await cleanupClient.connect();
  const uploadRegistry = cleanupClient.db(databaseName).collection("project_image_uploads");

  t.after(async () => {
    try {
      if (projectId) await deleteProject(projectId);
      if (otherProjectId) await deleteProject(otherProjectId);
      await uploadRegistry.deleteOne({ _id: uploadId });
    } finally {
      await Promise.all([cleanupClient.close(), closeMongoConnection()]);
    }
  });

  await t.test("creates and reads a draft through the application repository", async () => {
    const created = await createProject(projectInput(slug));
    projectId = created.id;
    assert.ok(created.id);
    assert.equal(created.isPublished, false);
    assert.equal(created.media.length, 2);
    assert.equal(created.image.publicId, "katiso-portfolio/project-pictures/integration-cover");
    assert.equal(await slugIsTaken(slug), true);
    assert.equal((await getProjectBySlug(slug)).id, created.id);
    assert.equal((await getProjectById(created.id)).id, created.id);
    assert.equal((await getProjects()).some((item) => item.id === created.id), false);
    assert.equal((await getProjects(true)).some((item) => item.id === created.id), true);
  });

  await t.test("enforces unique slugs and updates the chosen primary image on publish", async () => {
    await assert.rejects(createProject(projectInput(slug)), (error) => error?.code === 11000);

    const input = projectInput(slug);
    input.isPublished = true;
    input.media = input.media.map((item) => ({ ...item, isPrimary: item.id === "integration-secondary" }));
    const updated = await updateProject(projectId, input);
    assert.equal(updated.isPublished, true);
    assert.equal(updated.image.publicId, "katiso-portfolio/project-pictures/integration-secondary");
    assert.equal(updated.coverImage, input.media[1].secureUrl);
    assert.equal((await getProjects()).some((item) => item.id === projectId), true);
  });

  await t.test("unpublishes without deleting and then deletes through the application repository", async () => {
    const input = projectInput(slug);
    const unpublished = await updateProject(projectId, input);
    assert.equal(unpublished.isPublished, false);
    assert.equal((await getProjects()).some((item) => item.id === projectId), false);
    assert.equal((await getProjectById(projectId)).id, projectId);

    const other = await createProject(projectInput(`${slug}-shared-reference`));
    otherProjectId = other.id;
    assert.equal(await deleteProject(projectId), true);
    assert.equal(await getProjectById(projectId), null);
    assert.equal(await deleteProject(projectId), false);
    projectId = undefined;

    const deletedIds = [];
    const cleanupDependencies = {
      isReferenced: isProjectImageReferenced,
      deleteImage: async (publicId) => { deletedIds.push(publicId); return true; },
      removeRecord: async () => {},
      enqueue: async () => {},
    };
    const sharedId = "katiso-portfolio/project-pictures/integration-cover";
    assert.equal(await isProjectImageReferenced(sharedId), true);
    await cleanupUnreferencedProjectImages([sharedId], cleanupDependencies);
    assert.deepEqual(deletedIds, [], "an image still used by another project is never deleted");

    assert.equal(await deleteProject(otherProjectId), true);
    otherProjectId = undefined;
    await cleanupUnreferencedProjectImages([sharedId], cleanupDependencies);
    assert.deepEqual(deletedIds, [sharedId]);
  });

  await t.test("atomically allows only one MongoDB claimant for a registered image", async () => {
    await registerProjectImageUpload(uploadId);
    const claimed = await Promise.all([
      claimProjectImageUploads([uploadId]),
      claimProjectImageUploads([uploadId]),
      claimProjectImageUploads([uploadId]),
    ]);
    assert.deepEqual(claimed.flat(), [uploadId]);
    assert.deepEqual(await claimProjectImageUploads([uploadId]), []);
  });
});
