import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { connectedAccounts, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get internal user
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Delete the connected account if it belongs to the user
  const result = await db
    .delete(connectedAccounts)
    .where(
      and(
        eq(connectedAccounts.id, id),
        eq(connectedAccounts.userId, dbUser.id)
      )
    )
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: 'Account not found or unauthorized' }, { status: 404 });
  }

  return NextResponse.json({ success: true, platform: result[0].platform });
}
