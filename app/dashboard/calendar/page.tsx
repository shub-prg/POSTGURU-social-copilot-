import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, posts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { DashboardHeader } from '@/components/dashboard-header';
import { ContentCalendar } from '@/components/calendar/content-calendar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Calendar | PostGuru',
  description: 'View and manage your scheduled posts.',
};

export default async function CalendarPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!dbUser) return null;

  // Fetch all posts with their platform results
  const allPosts = await db.query.posts.findMany({
    where: eq(posts.userId, dbUser.id),
    with: {
      results: true,
    },
    orderBy: [desc(posts.createdAt)],
  });

  // Convert dates to strings for the client component
  const serializablePosts = allPosts.map(post => ({
    ...post,
    scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    results: post.results.map(r => ({
      ...r,
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    }))
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      <DashboardHeader title="Content Calendar" />
      <div 
          className="flex-1 overflow-y-auto custom-scrollbar rounded-2xl bg-white dark:bg-white/5 border border-border shadow-sm m-6"
        >
        <div className="max-w-[1600px] mx-auto py-8 px-6 h-full">
          <ContentCalendar initialPosts={serializablePosts} />
        </div>
      </div>
    </div>
  );
}
