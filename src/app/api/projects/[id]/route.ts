import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { isAdmin } from "@/lib/auth";
import { cleanupUploadedImage, deleteProjectImageFromCloudinary } from "@/lib/cloudinary";
import {
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

    // Publication check: require valid cover image
    const hasCoverImage = Boolean(parsed.data.coverImage?.trim()) || Boolean(parsed.data.image?.secureUrl?.trim());
    if (parsed.data.isPublished && !hasCoverImage) {
      return NextResponse.json(
        { message: "A valid cover image is required before publishing this project." },
        { status: 400 }
      );
    }

    // Determine if the image has been replaced
    const oldPublicId = existing.image?.publicId;
    const newPublicId = parsed.data.image?.publicId;
    const isImageReplaced = Boolean(newPublicId && oldPublicId && newPublicId !== oldPublicId);

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
      // If DB update fails and a new image was uploaded in this operation, clean it up
      if (isImageReplaced && newPublicId) {
        await cleanupUploadedImage(newPublicId);
      }
      throw dbError;
    }

    if (!updated) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    // If DB update succeeded and image was replaced, remove the previous Cloudinary asset
    if (isImageReplaced && oldPublicId) {
      try {
        await deleteProjectImageFromCloudinary(oldPublicId);
      } catch (cleanupError) {
        console.warn(`Failed to delete previous Cloudinary asset ${oldPublicId}:`, cleanupError);
      }
    }

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

    // Delete associated Cloudinary image
    const publicIdToDelete = existing.image?.publicId;
    if (publicIdToDelete) {
      try {
        await deleteProjectImageFromCloudinary(publicIdToDelete);
      } catch (cloudinaryError) {
        console.warn(`Failed to delete Cloudinary asset ${publicIdToDelete}:`, cloudinaryError);
      }
    }

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
