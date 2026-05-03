import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, mediaAssets } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { DashboardHeader } from '@/components/dashboard-header';
import { MediaGrid } from '@/components/media/media-grid';
import { Metadata } from 'next';
import { ImageIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Media Library | PostGuru',
  description: 'Manage your uploaded media assets.',
};

export default async function MediaLibraryPage() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) return null;

  // Get internal user ID
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  let assets: any[] = [];
  
  if (dbUser) {
    assets = await db.query.mediaAssets.findMany({
      where: eq(mediaAssets.userId, dbUser.id),
      orderBy: [desc(mediaAssets.createdAt)],
    });
  }

  // Convert to serializable format (Date to string)
  const serializableAssets = assets.map(asset => ({
    ...asset,
    createdAt: asset.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      <DashboardHeader title="Media Library" />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto py-8">
          <div className="px-6 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <ImageIcon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground/90">Media Library</h2>
              </div>
              <p className="text-muted-foreground text-sm max-w-lg">
                View and manage all your uploaded images and videos. These assets can be used when composing new social media posts.
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="text-3xl font-bold text-foreground/80">{serializableAssets.length}</div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Total Assets</div>
            </div>
          </div>
          
          <MediaGrid initialAssets={serializableAssets} />
        </div>
      </div>
    </div>
  );
}
