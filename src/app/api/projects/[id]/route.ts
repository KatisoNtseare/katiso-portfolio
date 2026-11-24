import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { isAdmin } from "@/lib/auth";
import { cleanupUnreferencedProjectImages } from "@/lib/asset-cleanup";
import {
  claimProjectImageUploads,
  deleteProject,
  getProjectById,
  isDuplicateKeyError,
  slugIsTaken,
  updateProject,
} from "@/lib/db";
import { projectSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid project ID." }, { status: 400 });
  }

  try {
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    if (!project.isPublished && !(await isAdmin())) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ message: "The project service is temporarily unavailable." }, { status: 503 });
  }
}

export async function PUT(request: Request, context: Context) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid project ID." }, { status: 400 });
  }

  try {
    const existing = await getProjectById(id);
    if (!existing) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    const body = await request.json();
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Invalid project data.", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    if (await slugIsTaken(parsed.data.slug, id)) {
      return NextResponse.json({ message: "That project URL slug is already in use." }, { status: 409 });
    }

    // Collect existing Cloudinary public IDs
    const existingPublicIds = new Set<string>();
    if (existing.image?.publicId) existingPublicIds.add(existing.image.publicId);
    (existing.media || []).forEach((m) => {
      if (m.type === "image" && m.publicId) existingPublicIds.add(m.publicId);
    });

    // Collect new Cloudinary public IDs
    const newPublicIds = new Set<string>();
    if (parsed.data.image?.publicId) newPublicIds.add(parsed.data.image.publicId);
    (parsed.data.media || []).forEach((m) => {
      if (m.type === "image" && m.publicId) newPublicIds.add(m.publicId);
    });

    // Removed images are in existing but not in new
    const removedPublicIds = Array.from(existingPublicIds).filter((pid) => !newPublicIds.has(pid));

    // Added images are in new but not in existing
    const newlyAddedPublicIds = Array.from(newPublicIds).filter((pid) => !existingPublicIds.has(pid));
    const trustedUploadedIds = await claimProjectImageUploads(newlyAddedPublicIds);
    if (trustedUploadedIds.length !== newlyAddedPublicIds.length) {
      await cleanupUnreferencedProjectImages(trustedUploadedIds);
      return NextResponse.json({ message: "New project images must be uploaded through the authenticated image upload endpoint." }, { status: 400 });
    }

    const projectData = {
      ...parsed.data,
      publishedAt: parsed.data.isPublished
        ? (existing.publishedAt || new Date().toISOString())
        : undefined,
    };

    let updated;
    try {
      updated = await updateProject(id, projectData);
    } catch (dbError) {
      await cleanupUnreferencedProjectImages(trustedUploadedIds);
      throw dbError;
    }

    if (!updated) {
      await cleanupUnreferencedProjectImages(trustedUploadedIds);
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    await cleanupUnreferencedProjectImages(removedPublicIds);

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${updated.slug}`);
    if (existing.slug !== updated.slug) {
      revalidatePath(`/projects/${existing.slug}`);
    }

    return NextResponse.json({ project: updated });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ message: "That project URL slug is already in use." }, { status: 409 });
    }
    return NextResponse.json(
      { message: "The project could not be updated. Check the MongoDB connection and try again." },
      { status: 503 }
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid project ID." }, { status: 400 });
  }

  try {
    const existing = await getProjectById(id);
    if (!existing) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    const deleted = await deleteProject(id);
    if (!deleted) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    // Collect IDs before deleting the document; cleanup rechecks all remaining references.
    const publicIdsToDelete = new Set<string>();
    if (existing.image?.publicId) publicIdsToDelete.add(existing.image.publicId);
    (existing.media || []).forEach((m) => {
      if (m.type === "image" && m.publicId) publicIdsToDelete.add(m.publicId);
    });

    await cleanupUnreferencedProjectImages([...publicIdsToDelete]);

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${existing.slug}`);

    return NextResponse.json({ message: "Project deleted." });
  } catch {
    return NextResponse.json(
      { message: "The project could not be deleted. Check the MongoDB connection and try again." },
      { status: 503 }
    );
  }
}
