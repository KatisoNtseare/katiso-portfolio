import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjectBySlug,
  getProjects,
  isProjectImageReferenced,
  registerProjectImageUpload,
  slugIsTaken,
  updateProject,
  claimProjectImageUploads,
} from "../src/lib/db.ts";
import { cleanupUnreferencedProjectImages } from "../src/lib/asset-cleanup.ts";
import { deleteProjectImageFromCloudinary } from "../src/lib/cloudinary.ts";
import { InMemoryMongoCollection } from "./in-memory-mongo.mjs";

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
    title: "Local integration test project",
    slug,
    summary: "A temporary project stored in an isolated in-memory MongoDB double.",
    description: "Repository integration test",
    category: "Testing",
    year: "2026",
    role: "Test",
    problem: "Test application persistence",
    solution: "Use a deterministic local MongoDB double",
    contributions: "Automated test",
    architecture: "Next.js and MongoDB repository",
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

test("Application repository CRUD, media persistence, publishing and draft visibility", async () => {
  const projects = new InMemoryMongoCollection();
  const slug = `local-integration-${Date.now()}`;
  const created = await createProject(projectInput(slug), projects);
  assert.ok(created.id);
  assert.equal(created.isPublished, false);
  assert.equal(created.media.length, 2);
  assert.equal(created.image.publicId, "katiso-portfolio/project-pictures/integration-cover");
  assert.equal(await slugIsTaken(slug, undefined, projects), true);
  assert.equal((await getProjectBySlug(slug, projects)).id, created.id);
  assert.equal((await getProjectById(created.id, projects)).id, created.id);
  assert.equal((await getProjects(false, projects)).some((item) => item.id === created.id), false);
  assert.equal((await getProjects(true, projects)).some((item) => item.id === created.id), true);
  await assert.rejects(createProject(projectInput(slug), projects), (error) => error?.code === 11000);

  const published = projectInput(slug);
  published.isPublished = true;
  published.media = published.media.map((item) => ({ ...item, isPrimary: item.id === "integration-secondary" }));
  const updated = await updateProject(created.id, published, projects);
  assert.equal(updated.isPublished, true);
  assert.equal(updated.image.publicId, "katiso-portfolio/project-pictures/integration-secondary");
  assert.equal(updated.coverImage, published.media[1].secureUrl);
  assert.equal((await getProjects(false, projects)).some((item) => item.id === created.id), true);

  const draft = projectInput(slug);
  const unpublished = await updateProject(created.id, draft, projects);
  assert.equal(unpublished.isPublished, false);
  assert.equal((await getProjects(false, projects)).some((item) => item.id === created.id), false);
  assert.equal((await getProjectById(created.id, projects)).id, created.id);
  assert.equal(await deleteProject(created.id, projects), true);
  assert.equal(await getProjectById(created.id, projects), null);
  assert.equal(await deleteProject(created.id, projects), false);
});

test("registered upload claims are atomic and cleanup protects shared image references", async () => {
  const uploads = new InMemoryMongoCollection();
  const publicId = "katiso-portfolio/project-pictures/local-registered-upload";
  await registerProjectImageUpload(publicId, uploads);
  const claims = await Promise.all([
    claimProjectImageUploads([publicId], uploads),
    claimProjectImageUploads([publicId], uploads),
    claimProjectImageUploads([publicId], uploads),
  ]);
  assert.deepEqual(claims.flat(), [publicId]);
  assert.deepEqual(await claimProjectImageUploads([publicId], uploads), []);
  assert.deepEqual(await claimProjectImageUploads(["katiso-portfolio/project-pictures/unregistered"], uploads), []);

  const projects = new InMemoryMongoCollection();
  const first = await createProject(projectInput("shared-image-one"), projects);
  const secondInput = projectInput("shared-image-two");
  secondInput.media = [image("integration-cover", true, 1)];
  const second = await createProject(secondInput, projects);
  const deleted = [];
  const cloudinaryClient = { uploader: { async destroy(id) { deleted.push(id); return { result: "ok" }; } } };
  const cleanup = {
    isReferenced: (id) => isProjectImageReferenced(id, projects),
    deleteImage: (id) => deleteProjectImageFromCloudinary(id, cloudinaryClient),
    removeRecord: async () => {},
    enqueue: async () => {},
  };

  const sharedId = "katiso-portfolio/project-pictures/integration-cover";
  await cleanupUnreferencedProjectImages([sharedId], cleanup);
  assert.deepEqual(deleted, [], "a shared image is retained while referenced by either project");
  await deleteProject(first.id, projects);
  await cleanupUnreferencedProjectImages([sharedId], cleanup);
  assert.deepEqual(deleted, [], "an image remains when a second project still references it");
  await deleteProject(second.id, projects);
  await cleanupUnreferencedProjectImages([sharedId], cleanup);
  assert.deepEqual(deleted, [sharedId], "the image can be deleted after its final project reference is removed");
});

test("cleanup queue persists a failed deletion and retries successfully", async () => {
  const { enqueueCloudinaryCleanup, getPendingCloudinaryCleanup, removeCloudinaryCleanup } = await import("../src/lib/db.ts");
  const queue = new InMemoryMongoCollection();
  const publicId = "katiso-portfolio/project-pictures/retry-local-image";
  let deletionAttempts = 0;
  const cloudinaryClient = { uploader: { async destroy() {
    deletionAttempts += 1;
    if (deletionAttempts === 1) throw new Error("temporary Cloudinary failure");
    return { result: "ok" };
  } } };
  const cleanup = {
    isReferenced: async () => false,
    deleteImage: (id) => deleteProjectImageFromCloudinary(id, cloudinaryClient),
    removeRecord: (id) => removeCloudinaryCleanup(id, queue),
    enqueue: (id, error) => enqueueCloudinaryCleanup(id, error, queue),
  };
  await cleanupUnreferencedProjectImages([publicId], cleanup);
  const pending = await getPendingCloudinaryCleanup(50, queue);
  assert.equal(pending.length, 1);
  assert.equal(pending[0]._id, publicId);
  assert.equal(pending[0].attempts, 1);
  await cleanupUnreferencedProjectImages([publicId], cleanup);
  assert.equal(deletionAttempts, 2);
  assert.deepEqual(await getPendingCloudinaryCleanup(50, queue), []);
});
