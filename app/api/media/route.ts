import { db } from "@/db";
import { mediaAssets, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, fileType, fileId } = await req.json();

    // Get the internal UUID for the user
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [newAsset] = await db.insert(mediaAssets).values({
      userId: user.id,
      url,
      fileType,
      fileId,
    }).returning();

    return NextResponse.json(newAsset);
  } catch (error) {
    console.error("Media asset save error:", error);
    return NextResponse.json({ error: "Failed to save media asset" }, { status: 500 });
  }
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!user) return NextResponse.json([]);

    const assets = await db.select().from(mediaAssets).where(eq(mediaAssets.userId, user.id));
    return NextResponse.json(assets);
  } catch (error) {
    console.error("Media asset fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch media assets" }, { status: 500 });
  }
}
