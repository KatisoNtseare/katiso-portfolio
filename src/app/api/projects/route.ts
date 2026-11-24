import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { claimProjectImageUploads, createProject, getProjects, isDuplicateKeyError, slugIsTaken } from "@/lib/db";
import { projectCreateSchema } from "@/lib/validation";
import { cleanupUnreferencedProjectImages } from "@/lib/asset-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wantsDrafts = searchParams.get("includeDrafts") === "true";
    const authenticated = await isAdmin();
    const includeDrafts = authenticated && wantsDrafts;

    const projects = await getProjects(includeDrafts);
    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ message: "The project service is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = projectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Invalid project data.", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    if (await slugIsTaken(parsed.data.slug)) {
      return NextResponse.json({ message: "That project URL slug is already in use." }, { status: 409 });
    }

    const imagePublicIds = (parsed.data.media || [])
      .filter((item) => item.type === "image")
      .map((image) => image.publicId);
    if (parsed.data.image?.publicId) imagePublicIds.push(parsed.data.image.publicId);
    const trustedUploadedIds = await claimProjectImageUploads(imagePublicIds);
    if (trustedUploadedIds.length !== new Set(imagePublicIds).size) {
      await cleanupUnreferencedProjectImages(trustedUploadedIds);
      return NextResponse.json({ message: "Project images must be uploaded through the authenticated image upload endpoint." }, { status: 400 });
    }

    const projectData = {
      ...parsed.data,
      publishedAt: parsed.data.isPublished ? (parsed.data.publishedAt || new Date().toISOString()) : undefined,
    };

    let project;
    try {
      project = await createProject(projectData);
    } catch (createError) {
      await cleanupUnreferencedProjectImages(trustedUploadedIds);
      throw createError;
    }

    // Revalidate public portfolio pages
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${project.slug}`);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ message: "That project URL slug is already in use." }, { status: 409 });
    }
    return NextResponse.json(
      { message: "The project could not be created. Check the MongoDB connection and try again." },
      { status: 503 }
    );
  }
}
