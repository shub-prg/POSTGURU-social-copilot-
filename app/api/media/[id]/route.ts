import { db } from "@/db";
import { mediaAssets, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Get the internal UUID for the user
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the asset and ensure it belongs to the user
    await db.delete(mediaAssets).where(
      and(
        eq(mediaAssets.id, id),
        eq(mediaAssets.userId, user.id)
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Media asset delete error:", error);
    return NextResponse.json({ error: "Failed to delete media asset" }, { status: 500 });
  }
}
