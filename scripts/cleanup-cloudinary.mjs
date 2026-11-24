import { retryPendingProjectImageCleanup } from "../src/lib/asset-cleanup.ts";
import { isCloudinaryConfigured } from "../src/lib/cloudinary.ts";

if (!process.env.MONGODB_URI?.trim()) {
  console.error("MONGODB_URI is missing. Configure it before retrying queued image cleanup.");
  process.exitCode = 1;
} else if (!isCloudinaryConfigured()) {
  console.error("Cloudinary credentials are missing. Configure them before retrying queued image cleanup.");
  process.exitCode = 1;
} else {
  try {
    const { attempted } = await retryPendingProjectImageCleanup();
    console.log(`Processed ${attempted} queued Cloudinary cleanup record(s). Failed items remain queued for the next retry.`);
  } catch (error) {
    console.error("Cloudinary cleanup retry failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
