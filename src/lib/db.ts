import "server-only";
import { MongoClient, ObjectId, type Collection, type Db, type Document } from "mongodb";
import type { Project, ProjectImage, ProjectInput } from "@/types/project";

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

function toProject(document: ProjectDocument): Project {
  const { _id, ...project } = document;
  return {
    ...project,
    id: _id.toHexString(),
    coverImage: project.coverImage || project.image?.secureUrl || "",
    altText: project.altText || project.image?.altText || "",
    image: project.image,
  };
}

function toDocument(input: ProjectInput, timestamps: { createdAt: string; updatedAt: string }): Omit<ProjectDocument, "_id"> {
  const coverImage = input.coverImage || input.image?.secureUrl || "";
  const altText = input.altText || input.image?.altText || "";
  return {
    ...input,
    coverImage,
    altText,
    image: input.image,
    ...timestamps,
  };
}

export function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

export async function getProjects(includeDrafts = false): Promise<Project[]> {
  const collection = await getProjectsCollection();
  const filter = includeDrafts ? {} : { isPublished: true };
  const documents = await collection
    .find(filter)
    .sort({ isFeatured: -1, sortOrder: 1, updatedAt: -1 })
    .toArray();
  return documents.map(toProject);
}

export async function getProjectBySlug(slug: string, includeDrafts = false): Promise<Project | undefined> {
  const collection = await getProjectsCollection();
  const filter = includeDrafts ? { slug } : { slug, isPublished: true };
  const document = await collection.findOne(filter);
  return document ? toProject(document) : undefined;
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  if (!ObjectId.isValid(id)) return undefined;
  const collection = await getProjectsCollection();
  const document = await collection.findOne({ _id: new ObjectId(id) });
  return document ? toProject(document) : undefined;
}

export async function slugIsTaken(slug: string, exceptId?: string): Promise<boolean> {
  const collection = await getProjectsCollection();
  const filter = exceptId && ObjectId.isValid(exceptId)
    ? { slug, _id: { $ne: new ObjectId(exceptId) } }
    : { slug };
  return Boolean(await collection.findOne(filter, { projection: { _id: 1 } }));
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const collection = await getProjectsCollection();
  const now = new Date().toISOString();
  const docData = toDocument(input, { createdAt: now, updatedAt: now });
  const document = {
    ...docData,
    _id: new ObjectId(),
  } as ProjectDocument;
  await collection.insertOne(document);
  return toProject(document);
}

export async function updateProject(id: string, input: ProjectInput): Promise<Project | undefined> {
  if (!ObjectId.isValid(id)) return undefined;
  const collection = await getProjectsCollection();
  const objectId = new ObjectId(id);
  const now = new Date().toISOString();
  const updateData: Partial<ProjectDocument> = {
    ...input,
    coverImage: input.coverImage || input.image?.secureUrl || "",
    altText: input.altText || input.image?.altText || "",
    updatedAt: now,
  };
  if (input.isPublished && !input.publishedAt) {
    updateData.publishedAt = now;
  }
  const result = await collection.updateOne(
    { _id: objectId },
    { $set: updateData },
  );
  if (result.matchedCount === 0) return undefined;
  return getProjectById(id);
}

export async function deleteProject(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getProjectsCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
