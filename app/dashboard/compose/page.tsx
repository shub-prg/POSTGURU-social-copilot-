import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, connectedAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DashboardHeader } from '@/components/dashboard-header';
import { PostComposer } from '@/components/compose/post-composer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compose Post | PostGuru',
  description: 'Create and schedule your social media posts.',
};

export default async function ComposePage(props: { searchParams?: Promise<{ date?: string }> }) {
  const { userId: clerkId } = await auth();

  if (!clerkId) return null;

  const searchParams = await props.searchParams;
  const initialDate = searchParams?.date;

  // Get internal user ID
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  let accounts: any[] = [];

  if (dbUser) {
    accounts = await db.query.connectedAccounts.findMany({
      where: eq(connectedAccounts.userId, dbUser.id),
      orderBy: (connectedAccounts, { asc }) => [asc(connectedAccounts.platform)],
    });
  }

  // Convert to serializable format
  const serializableAccounts = accounts.map(acc => ({
    ...acc,
    expiresAt: acc.expiresAt ? acc.expiresAt.toISOString() : null,
    createdAt: acc.createdAt.toISOString(),
    updatedAt: acc.updatedAt.toISOString(),
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      <DashboardHeader title="Compose Post" />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto py-8 px-6">
          <PostComposer connectedAccounts={serializableAccounts} userId={dbUser?.id || ""} initialDate={initialDate} />
        </div>
      </div>
    </div>
  );
}
