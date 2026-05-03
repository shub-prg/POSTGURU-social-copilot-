import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user from our DB
    const userResult = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      with: {
        settings: true,
      },
    });

    let internalUser = userResult;

    // If user doesn't exist in our DB yet
    if (!internalUser) {
      const clerkUser = await currentUser();
      if (!clerkUser) return new NextResponse("User not found in Clerk", { status: 404 });

      const [newUser] = await db.insert(users).values({
        clerkId,
        email: clerkUser.emailAddresses[0].emailAddress,
        name: `${clerkUser.firstName} ${clerkUser.lastName}`,
      }).returning();
      
      // Initialize settings for new user
      const [newSettings] = await db.insert(userSettings).values({
        userId: newUser.id,
      }).returning();

      return NextResponse.json(newSettings);
    }

    // If settings don't exist for existing user, create them
    if (!internalUser.settings) {
      const [settings] = await db.insert(userSettings).values({
        userId: internalUser.id,
      }).returning();
      return NextResponse.json(settings);
    }

    return NextResponse.json(internalUser.settings);
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      emailNotificationsEnabled,
      notifyOnPostSuccess,
      notifyOnPostFailure,
      notifyOnNewComment,
      aiReplyTone,
      timezone,
      weeklyReportEnabled,
    } = body;

    // Get internal user ID
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Update or Insert settings
    const updatedSettings = await db
      .insert(userSettings)
      .values({
        userId: user.id,
        emailNotificationsEnabled,
        notifyOnPostSuccess,
        notifyOnPostFailure,
        notifyOnNewComment,
        aiReplyTone,
        timezone,
        weeklyReportEnabled,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          emailNotificationsEnabled,
          notifyOnPostSuccess,
          notifyOnPostFailure,
          notifyOnNewComment,
          aiReplyTone,
          timezone,
          weeklyReportEnabled,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(updatedSettings[0]);
  } catch (error) {
    console.error("[SETTINGS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
