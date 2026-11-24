import test from "node:test";
import assert from "node:assert/strict";
import {
  CLOUDINARY_PROJECT_FOLDER,
  MAX_IMAGE_SIZE_BYTES,
  detectImageType,
  deleteProjectImageFromCloudinary,
  isProjectImagePublicId,
  uploadProjectImageToCloudinary,
} from "../src/lib/cloudinary.ts";

test("Cloudinary helpers enforce real upload and deletion rules", async (t) => {
  await t.test("accepts owned public IDs and legitimate nested folders", () => {
    assert.equal(CLOUDINARY_PROJECT_FOLDER, "katiso-portfolio/project-pictures");
    assert.equal(isProjectImagePublicId(`${CLOUDINARY_PROJECT_FOLDER}/cover_123`), true);
    assert.equal(isProjectImagePublicId(`${CLOUDINARY_PROJECT_FOLDER}/case-study/screenshots/view_123`), true);
  });

  await t.test("rejects prefix lookalikes, unrelated, empty and malformed IDs", () => {
    for (const value of [
      "katiso-portfolio/project-pictures-old/file",
      "katiso-portfolio/project-pictures2/file",
      "other-folder/file",
      "",
      "   ",
      `${CLOUDINARY_PROJECT_FOLDER}/../secret`,
      `${CLOUDINARY_PROJECT_FOLDER}//double-slash`,
      `${CLOUDINARY_PROJECT_FOLDER}/bad\\name`,
      `${CLOUDINARY_PROJECT_FOLDER}/bad?query=value`,
      `${CLOUDINARY_PROJECT_FOLDER}/`,
    ]) assert.equal(isProjectImagePublicId(value), false, String(value));
    assert.equal(isProjectImagePublicId(null), false);
  });

  await t.test("detects supported image formats and enforces 5 MB during real upload helper", async () => {
    assert.equal(MAX_IMAGE_SIZE_BYTES, 5 * 1024 * 1024);
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const webp = Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    assert.equal(detectImageType(jpeg)?.mime, "image/jpeg");
    assert.equal(detectImageType(png)?.mime, "image/png");
    assert.equal(detectImageType(webp)?.mime, "image/webp");
    await assert.rejects(uploadProjectImageToCloudinary(Buffer.alloc(0), {}, {}), /empty file/i);
    await assert.rejects(uploadProjectImageToCloudinary(Buffer.alloc(MAX_IMAGE_SIZE_BYTES + 1), {}, {}), /5 MB/i);
    await assert.rejects(uploadProjectImageToCloudinary(Buffer.from("not an image"), {}, {}), /unsupported image/i);
  });

  await t.test("uploads through an injected Cloudinary mock", async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const client = { uploader: { upload_stream(options, callback) {
      assert.equal(options.folder, CLOUDINARY_PROJECT_FOLDER);
      return { end() { callback(null, { secure_url: "https://res.cloudinary.com/demo/image/upload/cover.jpg", public_id: `${CLOUDINARY_PROJECT_FOLDER}/cover_123`, width: 10, height: 10, format: "jpg" }); } };
    } } };
    const image = await uploadProjectImageToCloudinary(jpeg, { altText: "Cover" }, client);
    assert.equal(image.publicId, `${CLOUDINARY_PROJECT_FOLDER}/cover_123`);
    assert.equal(image.altText, "Cover");
  });

  await t.test("only invokes destroy for valid in-folder IDs", async () => {
    const deleted = [];
    const client = { uploader: { async destroy(publicId, options) { deleted.push({ publicId, options }); return { result: "ok" }; } } };
    assert.equal(await deleteProjectImageFromCloudinary(`${CLOUDINARY_PROJECT_FOLDER}/safe/nested-image`, client), true);
    assert.equal(await deleteProjectImageFromCloudinary("katiso-portfolio/project-pictures-old/image", client), false);
    assert.equal(await deleteProjectImageFromCloudinary("other-folder/image", client), false);
    assert.equal(await deleteProjectImageFromCloudinary("", client), false);
    assert.equal(deleted.length, 1);
    assert.equal(deleted[0].options.invalidate, true);
  });
});
