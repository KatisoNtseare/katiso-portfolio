import "server-only";
import { MongoClient, ObjectId, type Collection, type Db, type Document, type Filter } from "mongodb";
import type { Project, ProjectImage, ProjectInput, ProjectMedia } from "@/types/project";
import { buildGoogleDriveEmbedUrl, getPrimaryImage, isValidGoogleDriveFileId } from "./media.ts";

export type ProjectDocument = {
  _id: ObjectId;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  year: string;
  role: string;
  problem: string;
  solution: string;
  contributions: string;
  architecture: string;
  architectureFlow: string[];
  challenges: string;
  outcomes: string;
  technologies: string[];
  coverImage: string;
  image?: ProjectImage;
  altText?: string;
  media?: ProjectMedia[];
  liveUrl: string;
  demoUrl: string;
  repoUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
} & Document;

type MongoGlobal = typeof globalThis & {
  portfolioMongoClient?: Promise<MongoClient>;
  portfolioProjectsCollection?: Promise<Collection<ProjectDocument>>;
};

const mongoGlobal = globalThis as MongoGlobal;

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add your MongoDB connection string to .env.local.");
  }
  return uri;
}

async function getDatabase(): Promise<Db> {
  if (!mongoGlobal.portfolioMongoClient) {
    const client = new MongoClient(getMongoUri(), {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
    });

    mongoGlobal.portfolioMongoClient = client.connect().catch((error: unknown) => {
      mongoGlobal.portfolioMongoClient = undefined;
      throw error;
    });
  }

  const client = await mongoGlobal.portfolioMongoClient;
  return client.db(process.env.MONGODB_DB?.trim() || "katiso_portfolio");
}

export async function getProjectsCollection(): Promise<Collection<ProjectDocument>> {
  if (!mongoGlobal.portfolioProjectsCollection) {
    mongoGlobal.portfolioProjectsCollection = (async () => {
      const database = await getDatabase();
      const collection = database.collection<ProjectDocument>("projects");
      await collection.createIndex({ slug: 1 }, { unique: true, name: "uq_projects_slug" });
      await collection.createIndex(
        { isPublished: 1, isFeatured: -1, sortOrder: 1, updatedAt: -1 },
        { name: "ix_projects_public_order" },
      );
      return collection;
    })().catch((error: unknown) => {
      mongoGlobal.portfolioProjectsCollection = undefined;
      throw error;
    });
  }

  return mongoGlobal.portfolioProjectsCollection;
}

export function toProject(document: ProjectDocument): Project {
  const { _id, ...project } = document;

  let media: ProjectMedia[] = Array.isArray(project.media) ? [...project.media] : [];

  // Synthesize default media item from legacy coverImage / image if media is empty
  if (media.length === 0 && (project.coverImage || project.image?.secureUrl)) {
    media = [
      {
        id: "media-default-1",
        type: "image",
        secureUrl: project.coverImage || project.image?.secureUrl || "",
        publicId: project.image?.publicId || "",
        altText: project.altText || project.image?.altText || `${project.title} cover image`,
        width: project.image?.width,
        height: project.image?.height,
        format: project.image?.format,
        displayOrder: 1,
        isPrimary: true,
      },
    ];
  }

  // Legacy media arrays sometimes predate the primary-image flag. Promote the
  // first image only when no primary was explicitly selected.
  if (project.isPublished && !media.some((item) => item.type === "image" && item.isPrimary)) {
    const firstImageIndex = media.findIndex((item) => item.type === "image");
    if (firstImageIndex >= 0) {
      media = media.map((item, index) => item.type === "image" && index === firstImageIndex
        ? { ...item, isPrimary: true }
        : item);
    }
  }

  // Never expose a persisted/client-provided iframe URL. Rebuild it from the
  // validated Drive ID, and leave malformed historical entries non-embeddable.
  media = media.map((item) => item.type === "video"
    ? { ...item, embedUrl: isValidGoogleDriveFileId(item.fileId) ? buildGoogleDriveEmbedUrl(item.fileId) : "" }
    : item);

  // Ensure there's a primary image if images exist
  const primary = getPrimaryImage(media);
  const coverImage = primary?.secureUrl || project.coverImage || project.image?.secureUrl || "";
  const altText = primary?.altText || project.altText || project.image?.altText || "";
  const image: ProjectImage | undefined = primary
    ? {
        secureUrl: primary.secureUrl,
        publicId: primary.publicId,
        altText: primary.altText,
        width: primary.width,
        height: primary.height,
        format: primary.format,
      }
    : project.image;

  return {
    ...project,
    id: _id.toHexString(),
    coverImage,
    altText,
    image,
    media,
  };
}

export function toDocument(input: ProjectInput, timestamps: { createdAt: string; updatedAt: string }): Omit<ProjectDocument, "_id"> {
  const media = (Array.isArray(input.media) ? [...input.media] : []).map((item) => item.type === "video"
    ? { ...item, embedUrl: buildGoogleDriveEmbedUrl(item.fileId) }
    : item);
  const primary = getPrimaryImage(media);

  const coverImage = primary?.secureUrl || input.coverImage || input.image?.secureUrl || "";
  const altText = primary?.altText || input.altText || input.image?.altText || "";
  const image: ProjectImage | undefined = primary
    ? {
        secureUrl: primary.secureUrl,
        publicId: primary.publicId,
        altText: primary.altText,
        width: primary.width,
        height: primary.height,
        format: primary.format,
      }
    : input.image;

  return {
    ...input,
    coverImage,
    altText,
    image,
    media,
    ...timestamps,
  };
}

export function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

export async function getProjects(includeDrafts = false): Promise<Project[]> {
  const collection = await getProjectsCollection();
  const filter = projectVisibilityFilter(includeDrafts);
  const documents = await collection
    .find(filter)
    .sort({ isFeatured: -1, sortOrder: 1, updatedAt: -1 })
    .toArray();
  return documents.map(toProject);
}

export function projectVisibilityFilter(includeDrafts = false): Filter<ProjectDocument> {
  return includeDrafts ? {} : { isPublished: true };
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const collection = await getProjectsCollection();
  const document = await collection.findOne({ slug: slug.toLowerCase() });
  return document ? toProject(document) : null;
}

export async function getProjectById(id: string): Promise<Project | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getProjectsCollection();
  const document = await collection.findOne({ _id: new ObjectId(id) });
  return document ? toProject(document) : null;
}

export async function slugIsTaken(slug: string, currentId?: string): Promise<boolean> {
  const collection = await getProjectsCollection();
  const filter: Record<string, unknown> = { slug: slug.toLowerCase() };
  if (currentId && ObjectId.isValid(currentId)) {
    filter._id = { $ne: new ObjectId(currentId) };
  }
  const match = await collection.findOne(filter, { projection: { _id: 1 } });
  return Boolean(match);
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const collection = await getProjectsCollection();
  const now = new Date().toISOString();
  const docData = toDocument(input, { createdAt: now, updatedAt: now });
  const result = await collection.insertOne(docData as ProjectDocument);
  return {
    ...input,
    coverImage: docData.coverImage,
    altText: docData.altText,
    image: docData.image,
    media: docData.media || [],
    id: result.insertedId.toHexString(),
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateProject(id: string, input: ProjectInput): Promise<Project | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getProjectsCollection();
  const existing = await collection.findOne({ _id: new ObjectId(id) });
  if (!existing) return null;

  const now = new Date().toISOString();
  const docData = toDocument(input, { createdAt: existing.createdAt, updatedAt: now });

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: docData },
    { returnDocument: "after" }
  );

  return result ? toProject(result) : null;
}

export async function deleteProject(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getProjectsCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function isProjectImageReferenced(publicId: string): Promise<boolean> {
  const collection = await getProjectsCollection();
  return Boolean(await collection.findOne({
    $or: [
      { "image.publicId": publicId },
      { media: { $elemMatch: { type: "image", publicId } } },
    ],
  }, { projection: { _id: 1 } }));
}

type CloudinaryCleanupRecord = { _id: string; attempts: number; createdAt: string; lastAttemptAt: string; lastError: string };

export async function enqueueCloudinaryCleanup(publicId: string, error: string): Promise<void> {
  const database = await getDatabase();
  await database.collection<CloudinaryCleanupRecord>("cloudinary_cleanup").updateOne(
    { _id: publicId },
    { $setOnInsert: { createdAt: new Date().toISOString() }, $set: { lastAttemptAt: new Date().toISOString(), lastError: error }, $inc: { attempts: 1 } },
    { upsert: true },
  );
}

export async function getPendingCloudinaryCleanup(limit = 50): Promise<CloudinaryCleanupRecord[]> {
  const database = await getDatabase();
  return database.collection<CloudinaryCleanupRecord>("cloudinary_cleanup").find().sort({ createdAt: 1 }).limit(limit).toArray();
}

export async function removeCloudinaryCleanup(publicId: string): Promise<void> {
  const database = await getDatabase();
  await database.collection<CloudinaryCleanupRecord>("cloudinary_cleanup").deleteOne({ _id: publicId });
}

export async function registerProjectImageUpload(publicId: string): Promise<void> {
  const database = await getDatabase();
  await database.collection<{ _id: string; createdAt: string }>("project_image_uploads").updateOne(
    { _id: publicId },
    { $set: { createdAt: new Date().toISOString() } },
    { upsert: true },
  );
}

export async function claimProjectImageUploads(publicIds: string[]): Promise<string[]> {
  const ids = [...new Set(publicIds)].filter(Boolean);
  if (!ids.length) return [];
  const database = await getDatabase();
  const collection = database.collection<{ _id: string }>("project_image_uploads");
  const found = await collection.find({ _id: { $in: ids } }, { projection: { _id: 1 } }).toArray();
  const trustedIds = found.map((item) => item._id);
  if (trustedIds.length) await collection.deleteMany({ _id: { $in: trustedIds } });
  return trustedIds;
}
