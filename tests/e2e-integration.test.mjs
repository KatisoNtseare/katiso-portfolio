import test from "node:test";
import assert from "node:assert/strict";
import {
  CLOUDINARY_PROJECT_FOLDER,
  MAX_IMAGE_SIZE_BYTES,
  deleteProjectImageFromCloudinary,
  isProjectImagePublicId,
  uploadProjectImageToCloudinary,
} from "../src/lib/cloudinary.ts";
import { claimProjectImageUploads, registerProjectImageUpload } from "../src/lib/db.ts";
import { InMemoryMongoCollection } from "./in-memory-mongo.mjs";

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

test("application upload validation, Cloudinary mock, and registered image claim flow", async (t) => {
  const uploadedAssets = new Map();
  const deletedAssets = [];
  let uploadCalls = 0;
  const cloudinary = {
    uploader: {
      upload_stream(options, callback) {
        uploadCalls += 1;
        assert.equal(options.folder, CLOUDINARY_PROJECT_FOLDER);
        assert.equal(options.resource_type, "image");
        const publicId = `${CLOUDINARY_PROJECT_FOLDER}/mock-upload-${uploadCalls}`;
        return { end() {
          const result = {
            secure_url: `https://res.cloudinary.com/test/image/upload/${publicId}.png`,
            public_id: publicId,
            width: 1,
            height: 1,
            format: "png",
          };
          uploadedAssets.set(publicId, result);
          callback(null, result);
        } };
      },
      async destroy(publicId, options) {
        assert.equal(options.invalidate, true);
        deletedAssets.push(publicId);
        uploadedAssets.delete(publicId);
        return { result: "ok" };
      },
    },
  };
  t.after(async () => {
    for (const publicId of [...uploadedAssets.keys()]) {
      const deleted = await deleteProjectImageFromCloudinary(publicId, cloudinary);
      assert.equal(deleted, true, `temporary mock asset ${publicId} is cleaned up`);
    }
    assert.equal(uploadedAssets.size, 0);
  });

  await assert.rejects(uploadProjectImageToCloudinary(Buffer.alloc(0), {}, cloudinary), /empty file/i);
  await assert.rejects(uploadProjectImageToCloudinary(Buffer.alloc(MAX_IMAGE_SIZE_BYTES + 1), {}, cloudinary), /5 MB/i);
  await assert.rejects(uploadProjectImageToCloudinary(Buffer.from("not an image"), {}, cloudinary), /unsupported image/i);
  assert.equal(uploadCalls, 0, "invalid inputs never reach the Cloudinary client");

  const registry = new InMemoryMongoCollection();
  const [cover, gallery] = await Promise.all([
    uploadProjectImageToCloudinary(validPng, { altText: "Cover" }, cloudinary),
    uploadProjectImageToCloudinary(validPng, { altText: "Gallery image" }, cloudinary),
  ]);
  assert.equal(uploadedAssets.size, 2);
  assert.ok([cover, gallery].every((item) => isProjectImagePublicId(item.publicId)));
  assert.ok([cover, gallery].every((item) => item.secureUrl.startsWith("https://")));

  await Promise.all([cover, gallery].map((item) => registerProjectImageUpload(item.publicId, registry)));
  const claimed = await Promise.all([
    claimProjectImageUploads([cover.publicId, gallery.publicId], registry),
    claimProjectImageUploads([cover.publicId, gallery.publicId], registry),
  ]);
  assert.deepEqual(claimed.flat().sort(), [cover.publicId, gallery.publicId].sort());
  assert.deepEqual(await claimProjectImageUploads(["katiso-portfolio/project-pictures/unregistered"], registry), []);

  assert.equal(await deleteProjectImageFromCloudinary(cover.publicId, cloudinary), true);
  assert.deepEqual(deletedAssets, [cover.publicId]);
  assert.equal(uploadedAssets.has(cover.publicId), false);
  assert.equal(uploadedAssets.has(gallery.publicId), true, "unselected test asset remains available for cleanup");
  assert.equal(await deleteProjectImageFromCloudinary("katiso-portfolio/project-pictures-old/unsafe", cloudinary), false);
  assert.deepEqual(deletedAssets, [cover.publicId], "invalid folder IDs never reach Cloudinary destroy");
});
