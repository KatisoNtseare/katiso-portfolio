import "server-only";
import { deleteProjectImageFromCloudinary, isProjectImagePublicId } from "./cloudinary.ts";
import {
  enqueueCloudinaryCleanup,
  getPendingCloudinaryCleanup,
  isProjectImageReferenced,
  removeCloudinaryCleanup,
} from "./db.ts";

type CleanupDependencies = {
  isReferenced: typeof isProjectImageReferenced;
  deleteImage: typeof deleteProjectImageFromCloudinary;
  removeRecord: typeof removeCloudinaryCleanup;
  enqueue: typeof enqueueCloudinaryCleanup;
};

export async function cleanupUnreferencedProjectImages(
  publicIds: string[],
  overrides: Partial<CleanupDependencies> = {},
): Promise<void> {
  const dependencies: CleanupDependencies = {
    isReferenced: isProjectImageReferenced,
    deleteImage: deleteProjectImageFromCloudinary,
    removeRecord: removeCloudinaryCleanup,
    enqueue: enqueueCloudinaryCleanup,
    ...overrides,
  };
  for (const publicId of [...new Set(publicIds)]) {
    if (!isProjectImagePublicId(publicId)) {
      console.error("Skipped cleanup for an invalid Cloudinary project image ID.");
      continue;
    }
    try {
      if (await dependencies.isReferenced(publicId)) continue;
      if (await dependencies.deleteImage(publicId)) {
        await dependencies.removeRecord(publicId).catch((error) => console.error("Removed asset, but could not clear its cleanup record:", error));
      } else {
        await dependencies.enqueue(publicId, "Cloudinary did not confirm deletion.");
        console.error(`Cloudinary cleanup queued for retry: ${publicId}`);
      }
    } catch (error) {
      console.error(`Cloudinary cleanup failed for ${publicId}:`, error);
      try { await dependencies.enqueue(publicId, error instanceof Error ? error.message : String(error)); }
      catch (queueError) { console.error(`Could not persist Cloudinary cleanup retry for ${publicId}:`, queueError); }
    }
  }
}

export async function retryPendingProjectImageCleanup(): Promise<{ attempted: number }> {
  const pending = await getPendingCloudinaryCleanup();
  await cleanupUnreferencedProjectImages(pending.map((item) => item._id));
  return { attempted: pending.length };
}
