import test from "node:test";
import assert from "node:assert/strict";
import { projectCreateSchema, projectSchema } from "../src/lib/validation.ts";
import { buildGoogleDriveEmbedUrl, extractGoogleDriveFileId, sortProjectMedia } from "../src/lib/media.ts";
import { addProjectMedia, removeProjectMedia, reorderProjectMedia, setPrimaryProjectImage } from "../src/lib/project-media.ts";
import { claimProjectImageUploads, projectVisibilityFilter, toDocument, toProject } from "../src/lib/db.ts";
import { cleanupUnreferencedProjectImages } from "../src/lib/asset-cleanup.ts";
import { ObjectId } from "mongodb";

const id = "1AbcDefGhiJklmnopQrsTuvWxYZ";
const base = { title: "Valid project", slug: "valid-project", summary: "A valid project summary", isPublished: false };
const image = (mediaId, primary = false, displayOrder = 1) => ({
  id: mediaId, type: "image", secureUrl: `https://res.cloudinary.com/demo/${mediaId}.jpg`,
  publicId: `katiso-portfolio/project-pictures/${mediaId}`, altText: mediaId, displayOrder, isPrimary: primary,
});
const video = (mediaId, originalUrl = `https://drive.google.com/file/d/${id}/view`, embedUrl = "https://evil.example/frame") => ({
  id: mediaId, type: "video", provider: "google-drive", fileId: id, originalUrl, embedUrl, title: "Demo", displayOrder: 2,
});

test("Drive video links are parsed from supported Google URLs only", () => {
  assert.equal(extractGoogleDriveFileId(`https://drive.google.com/file/d/${id}/view?usp=sharing`), id);
  assert.equal(extractGoogleDriveFileId(`https://drive.google.com/open?id=${id}&usp=sharing`), id);
  assert.equal(extractGoogleDriveFileId(`https://drive.google.com/uc?id=${id}&export=download`), id);
  for (const invalid of ["https://evil.example/file/d/" + id, "http://drive.google.com/file/d/" + id, `https://drive.google.com/file/d/short/view`, "not a url", `https://drive.google.com.evil.example/file/d/${id}`]) {
    assert.equal(extractGoogleDriveFileId(invalid), null, invalid);
  }
  assert.equal(buildGoogleDriveEmbedUrl(id), `https://drive.google.com/file/d/${id}/preview`);
  assert.throws(() => buildGoogleDriveEmbedUrl("../malicious"), /Invalid Google Drive file ID/);
});

test("project schemas allow fallback covers and validate uploaded primary images", () => {
  assert.equal(projectSchema.safeParse({ ...base, media: [] }).success, true, "draft can have no image");
  assert.equal(projectSchema.safeParse({ ...base, media: [image("one")] }).success, true, "draft may have no primary");
  assert.equal(projectCreateSchema.safeParse(base).success, true, "new draft may be empty");
  assert.equal(projectSchema.safeParse({ ...base, isPublished: true, media: [image("one", true)] }).success, true);
  const legacyDraft = projectSchema.safeParse({ ...base, isPublished: true, publishedAt: null, media: [image("one", true)] });
  assert.equal(legacyDraft.success, true, "legacy null publication timestamps are treated as unset when publishing");
  assert.equal(legacyDraft.data.publishedAt, undefined, "the API can assign a trusted timestamp on publish");
  assert.equal(projectSchema.safeParse({ ...base, isPublished: true, media: [] }).success, true, "published projects can use the default fallback image");
  assert.equal(projectSchema.safeParse({ ...base, isPublished: true, coverImage: image("legacy").secureUrl, media: [] }).success, true, "legacy covers remain accepted");
  assert.equal(projectSchema.safeParse({ ...base, isPublished: true, media: [image("one"), image("two")] }).success, false, "uploaded images require one primary selection");
  assert.equal(projectSchema.safeParse({ ...base, isPublished: true, media: [image("one", true), image("two", true)] }).success, false);
  assert.equal(projectSchema.safeParse({ ...base, media: [{ ...video("video"), isPrimary: true }] }).success, false, "video cannot be marked primary");
});

test("project updates accept the Luminar Learning technology list and live URL", () => {
  const parsed = projectSchema.safeParse({
    ...base,
    liveUrl: "https://soit-iis.mandela.ac.za/grp-03-21",
    technologies: Array.from({ length: 21 }, (_, index) => `Technology ${index + 1}`),
  });
  assert.equal(parsed.success, true);
});

test("video schema derives its embed URL and rejects mismatched or hostile links", () => {
  const parsed = projectSchema.safeParse({ ...base, media: [video("vid") ] });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.media[0].embedUrl, `https://drive.google.com/file/d/${id}/preview`);
  assert.equal(parsed.data.media[0].embedUrl.includes("evil.example"), false);
  assert.equal(projectSchema.safeParse({ ...base, media: [video("vid", "https://evil.example/file/d/" + id)] }).success, false);
  const hostileEmbed = projectSchema.safeParse({ ...base, media: [video("vid", `https://drive.google.com/file/d/${id}/view`, `javascript:alert(1)`)] });
  assert.equal(hostileEmbed.success, true);
  assert.equal(hostileEmbed.data.media[0].embedUrl, `https://drive.google.com/file/d/${id}/preview`, "hostile iframe URL is discarded");
  assert.equal(projectSchema.safeParse({ ...base, media: [video("vid", `https://drive.google.com/file/d/${id}/view`), ...Array.from({ length: 5 }, (_, n) => video(`v${n}`, `https://drive.google.com/file/d/${id}/view`))] }).success, false, "more than five videos rejected");
  assert.equal(projectSchema.safeParse({ ...base, media: Array.from({ length: 21 }, (_, n) => image(`im${n}`)) }).success, false, "more than twenty images rejected");
});

test("shared admin media operations add, remove, select, reorder and enforce limits", () => {
  let media = addProjectMedia([], image("one"));
  assert.equal(media[0].isPrimary, true);
  media = addProjectMedia(media, image("two"));
  media = setPrimaryProjectImage(media, "two");
  assert.deepEqual(media.filter((item) => item.type === "image" && item.isPrimary).map((item) => item.id), ["two"]);
  media = addProjectMedia(media, video("vid"));
  media = reorderProjectMedia(media, 2, "up");
  assert.deepEqual(media.map((item) => item.id), ["one", "vid", "two"]);
  assert.deepEqual(sortProjectMedia([...media].reverse()).map((item) => item.id), ["one", "vid", "two"]);
  media = removeProjectMedia(media, "two");
  assert.equal(media.find((item) => item.type === "image").isPrimary, true, "removing primary selects next image");
  assert.throws(() => Array.from({ length: 20 }, (_, n) => image(`i${n}`)).reduce((list, item) => addProjectMedia(list, item), []).concat([image("extra")]).reduce((list, item) => addProjectMedia(list, item), []), /more than 20/);
});

test("database reader preserves legacy cover images and canonicalizes video embeds", () => {
  const legacy = toProject({ _id: new ObjectId(), title: "Legacy", slug: "legacy", coverImage: "https://res.cloudinary.com/demo/legacy.jpg", image: { secureUrl: "https://res.cloudinary.com/demo/legacy.jpg", publicId: "katiso-portfolio/project-pictures/legacy" }, media: [], isPublished: true });
  assert.equal(legacy.media[0].isPrimary, true);
  assert.equal(legacy.coverImage, "https://res.cloudinary.com/demo/legacy.jpg");
  const withVideo = toProject({ _id: new ObjectId(), title: "Video", slug: "video", coverImage: "", media: [video("v", `https://drive.google.com/file/d/${id}/view`, "https://attacker.example/iframe")] });
  assert.equal(withVideo.media[0].embedUrl, `https://drive.google.com/file/d/${id}/preview`);
});

test("database mapping persists mixed media order and primary image, and public queries exclude drafts", () => {
  const doc = toDocument({ ...base, media: [image("cover", true, 4), video("demo", `https://drive.google.com/file/d/${id}/view`, "https://evil.example/frame")] }, { createdAt: "created", updatedAt: "updated" });
  assert.deepEqual(doc.media.map((item) => item.displayOrder), [4, 2]);
  assert.equal(doc.media[0].isPrimary, true);
  assert.equal(doc.media[1].embedUrl, `https://drive.google.com/file/d/${id}/preview`);
  assert.equal(doc.coverImage, image("cover", true, 4).secureUrl);
  assert.deepEqual(projectVisibilityFilter(), { isPublished: true });
  assert.deepEqual(projectVisibilityFilter(true), {});
});

test("Cloudinary cleanup checks references and persists failed deletions", async () => {
  const calls = [];
  await cleanupUnreferencedProjectImages([
    "katiso-portfolio/project-pictures/still-used",
    "katiso-portfolio/project-pictures/retry-me",
    "katiso-portfolio/project-pictures/removed",
    "katiso-portfolio/project-pictures-old/untrusted",
  ], {
    isReferenced: async (publicId) => publicId.endsWith("still-used"),
    deleteImage: async (publicId) => { calls.push(`delete:${publicId}`); return !publicId.endsWith("retry-me"); },
    removeRecord: async (publicId) => { calls.push(`remove:${publicId}`); },
    enqueue: async (publicId) => { calls.push(`queue:${publicId}`); },
  });
  assert.equal(calls.includes("delete:katiso-portfolio/project-pictures/still-used"), false, "referenced images are never deleted");
  assert.equal(calls.includes("remove:katiso-portfolio/project-pictures/still-used"), true, "stale cleanup record is removed for referenced image");
  assert.equal(calls.includes("queue:katiso-portfolio/project-pictures/retry-me"), true);
  assert.equal(calls.includes("remove:katiso-portfolio/project-pictures/removed"), true);
  assert.equal(calls.some((call) => call.includes("untrusted")), false);
});

test("failed Cloudinary deletion is retried and stale records are removed after success", async () => {
  const publicId = "katiso-portfolio/project-pictures/retry-flow";
  const queued = new Set();
  let deletionAttempts = 0;
  const dependencies = {
    isReferenced: async () => false,
    deleteImage: async () => { deletionAttempts += 1; return deletionAttempts > 1; },
    removeRecord: async (idToRemove) => { queued.delete(idToRemove); },
    enqueue: async (idToQueue) => { queued.add(idToQueue); },
  };

  await cleanupUnreferencedProjectImages([publicId], dependencies);
  assert.equal(queued.has(publicId), true);
  await cleanupUnreferencedProjectImages([...queued], dependencies);
  assert.equal(deletionAttempts, 2);
  assert.equal(queued.has(publicId), false);
});

test("concurrent upload claims are atomic and return an upload to only one caller", async () => {
  const publicId = "katiso-portfolio/project-pictures/concurrent-upload";
  const records = new Map([[publicId, { _id: publicId }]]);
  const collection = {
    async findOneAndDelete({ _id }) {
      const record = records.get(_id);
      if (!record) return null;
      records.delete(_id);
      return record;
    },
  };

  const results = await Promise.all([
    claimProjectImageUploads([publicId, publicId], collection),
    claimProjectImageUploads([publicId], collection),
    claimProjectImageUploads([publicId], collection),
  ]);
  assert.deepEqual(results.flat(), [publicId]);
  assert.equal(records.has(publicId), false);
  assert.deepEqual(await claimProjectImageUploads(["katiso-portfolio/project-pictures/not-registered"], collection), []);
});
