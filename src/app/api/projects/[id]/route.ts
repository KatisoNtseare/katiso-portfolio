import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deleteProject, getProjectById, isDuplicateKeyError, slugIsTaken, updateProject } from "@/lib/db";
import { projectSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  const { id } = await context.params;

  try {
    if (!(await getProjectById(id))) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    const parsed = projectSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || "Invalid project data." }, { status: 400 });
    }
    if (await slugIsTaken(parsed.data.slug, id)) {
      return NextResponse.json({ message: "That project URL slug is already in use." }, { status: 409 });
    }

    const project = await updateProject(id, parsed.data);
    if (!project) return NextResponse.json({ message: "Project not found." }, { status: 404 });
    return NextResponse.json({ project });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ message: "That project URL slug is already in use." }, { status: 409 });
    }
    return NextResponse.json({ message: "The project could not be updated. Check the MongoDB connection and try again." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  const { id } = await context.params;

  try {
    if (!(await deleteProject(id))) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Project deleted." });
  } catch {
    return NextResponse.json({ message: "The project could not be deleted. Check the MongoDB connection and try again." }, { status: 503 });
  }
}
