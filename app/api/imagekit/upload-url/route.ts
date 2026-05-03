import { NextResponse } from "next/server";
import { imagekit } from "@/lib/imagekit";

export async function POST(req: Request) {
  try {
    const { url, fileName } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const uploadResponse = await imagekit.upload({
      file: url,
      fileName: fileName || `upload-${Date.now()}.jpg`,
      folder: "/social-copilot/imports",
    });

    return NextResponse.json(uploadResponse);
  } catch (error: any) {
    console.error("ImageKit upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image to ImageKit" },
      { status: 500 }
    );
  }
}
