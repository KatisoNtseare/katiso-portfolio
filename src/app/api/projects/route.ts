import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createProject, getProjects, isDuplicateKeyError, slugIsTaken } from "@/lib/db";
import { projectSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ projects: await getProjects() });
  } catch {
    return NextResponse.json({ message: "The project service is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Unauthorised." }, { status: 401 });

  try {
    const parsed = projectSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || "Invalid project data." }, { status: 400 });
    }
    if (await slugIsTaken(parsed.data.slug)) {
      return NextResponse.json({ message: "That project URL slug is already in use." }, { status: 409 });
    }

    const project = await createProject(parsed.data);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ message: "That project URL slug is already in use." }, { status: 409 });
    }
    return NextResponse.json({ message: "The project could not be created. Check the MongoDB connection and try again." }, { status: 503 });
  }
}
