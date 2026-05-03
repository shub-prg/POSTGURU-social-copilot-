import { db } from "@/db";
import { posts, postPlatformResults, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { desc, eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, mediaUrls, platforms, scheduledAt, status, userId } = await req.json();

    // 1. Create the post in DB
    const [newPost] = await db.insert(posts).values({
      userId,
      content,
      mediaUrls,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: status,
    }).returning();

    // 2. Initialize platform results
    if (platforms && platforms.length > 0) {
      const results = platforms.map((platform: any) => ({
        postId: newPost.id,
        platform,
        status: status === "SCHEDULED" ? "SCHEDULED" : "DRAFT",
      }));
      await db.insert(postPlatformResults).values(results);
    }

    // 3. If scheduled or immediate, send to Inngest
    if (status === "PUBLISHED" || status === "SCHEDULED") {
      const scheduledTime = scheduledAt ? new Date(scheduledAt).getTime() : Date.now();
      
      await inngest.send({
        name: "post/scheduled",
        data: {
          postId: newPost.id,
          userId,
        },
        // If scheduledAt is in the future, Inngest will wait until then
        ts: scheduledTime,
      });
    }

    return NextResponse.json(newPost);
  } catch (error) {
    console.error("Post creation error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const latestPost = await db.query.posts.findFirst({
      where: eq(posts.userId, dbUser.id),
      orderBy: [desc(posts.createdAt)],
    });

    return NextResponse.json(latestPost || null);
  } catch (error) {
    console.error("Fetch latest post error:", error);
    return NextResponse.json({ error: "Failed to fetch latest post" }, { status: 500 });
  }
}
