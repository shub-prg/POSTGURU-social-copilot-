import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, connectedAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DashboardHeader } from '@/components/dashboard-header';
import { AccountsGrid } from '@/components/accounts/accounts-grid';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connected Accounts | PostGuru',
  description: 'Manage your social media platform accounts.',
};

export default async function AccountsPage() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) return null;

  // Get internal user ID
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  let accounts: any[] = [];
  
  if (dbUser) {
    accounts = await db.query.connectedAccounts.findMany({
      where: eq(connectedAccounts.userId, dbUser.id),
    });
  }

  // Convert to serializable format (Date to string)
  const serializableAccounts = accounts.map(acc => ({
    ...acc,
    expiresAt: acc.expiresAt ? acc.expiresAt.toISOString() : null,
    createdAt: acc.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      <DashboardHeader title="Connected Accounts" />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto py-4">
          <div className="px-6 mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground/90">Platforms</h2>
            <p className="text-muted-foreground text-sm">
              Connect your social media accounts to start scheduling posts and tracking analytics.
            </p>
          </div>
          
          <AccountsGrid connectedAccounts={serializableAccounts} />
        </div>
      </div>
    </div>
  );
}
