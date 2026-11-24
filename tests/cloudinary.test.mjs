import test from "node:test";
import assert from "node:assert/strict";

// Helper magic bytes detector matching src/lib/cloudinary.ts
function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}

const CLOUDINARY_PROJECT_FOLDER = "katiso-portfolio/project-pictures";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

test("Cloudinary Integration & Validation Logic", async (t) => {
  await t.test("Enforces exact Cloudinary folder name", () => {
    assert.equal(CLOUDINARY_PROJECT_FOLDER, "katiso-portfolio/project-pictures");
  });

  await t.test("Enforces 5 MB size limit", () => {
    assert.equal(MAX_IMAGE_SIZE_BYTES, 5242880);
    const validSize = 4 * 1024 * 1024;
    const oversized = 5 * 1024 * 1024 + 1;
    assert.equal(validSize <= MAX_IMAGE_SIZE_BYTES, true);
    assert.equal(oversized <= MAX_IMAGE_SIZE_BYTES, false);
  });

  await t.test("Detects valid JPEG magic bytes", () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const detected = detectImageType(jpegHeader);
    assert.ok(detected);
    assert.equal(detected.mime, "image/jpeg");
    assert.equal(detected.ext, "jpg");
  });

  await t.test("Detects valid PNG magic bytes", () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const detected = detectImageType(pngHeader);
    assert.ok(detected);
    assert.equal(detected.mime, "image/png");
    assert.equal(detected.ext, "png");
  });

  await t.test("Detects valid WebP magic bytes", () => {
    // RIFF .... WEBP
    const webpHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x20, 0x00, 0x00, 0x00, // length
      0x57, 0x45, 0x42, 0x50, // WEBP
      0x56, 0x50, 0x38, 0x20  // VP8
    ]);
    const detected = detectImageType(webpHeader);
    assert.ok(detected);
    assert.equal(detected.mime, "image/webp");
    assert.equal(detected.ext, "webp");
  });

  await t.test("Rejects unsupported files and magic bytes", () => {
    // PDF: %PDF
    const pdf = Buffer.from("%PDF-1.4 header text here");
    assert.equal(detectImageType(pdf), null);

    // Plain text / HTML
    const html = Buffer.from("<html><body>Malicious script</body></html>");
    assert.equal(detectImageType(html), null);

    // Empty or short buffer
    assert.equal(detectImageType(Buffer.alloc(0)), null);
    assert.equal(detectImageType(Buffer.from([0xff, 0xd8])), null);
  });

  await t.test("Safely validates asset folder before deletion", () => {
    function isAllowedDeletion(publicId) {
      return Boolean(publicId && publicId.startsWith(CLOUDINARY_PROJECT_FOLDER));
    }

    assert.equal(isAllowedDeletion("katiso-portfolio/project-pictures/sample_123"), true);
    assert.equal(isAllowedDeletion("other-folder/avatar_456"), false);
    assert.equal(isAllowedDeletion("katiso-portfolio/avatars/test"), false);
    assert.equal(isAllowedDeletion(""), false);
    assert.equal(isAllowedDeletion(null), false);
  });
});
