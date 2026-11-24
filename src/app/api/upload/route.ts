import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  MAX_IMAGE_SIZE_BYTES,
  detectImageType,
  deleteProjectImageFromCloudinary,
  isCloudinaryConfigured,
  uploadProjectImageToCloudinary,
} from "@/lib/cloudinary";
import { registerProjectImageUpload } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { message: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const altText = (formData.get("altText") as string | null)?.trim() || "";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ message: "No image file provided." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ message: "The uploaded file is empty." }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { message: `File size exceeds the 5 MB limit (file is ${(file.size / (1024 * 1024)).toFixed(2)} MB).` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detected = detectImageType(buffer);
    if (!detected) {
      return NextResponse.json(
        { message: "Invalid image format. Only JPEG, PNG, and WebP files are supported." },
        { status: 400 }
      );
    }

    const image = await uploadProjectImageToCloudinary(buffer, { altText });

    try {
      await registerProjectImageUpload(image.publicId);
    } catch (error) {
      const deleted = await deleteProjectImageFromCloudinary(image.publicId);
      if (!deleted) console.error(`New Cloudinary upload could not be registered or removed: ${image.publicId}`, error);
      return NextResponse.json({ message: "Image storage is temporarily unavailable. Please try again." }, { status: 503 });
    }

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload image to Cloudinary.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
