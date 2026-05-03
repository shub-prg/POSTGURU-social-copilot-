import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { DashboardHeader } from "@/components/dashboard-header";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { 
  getAnalyticsOverview, 
  getFollowerGrowthData, 
  getPostPerformanceData 
} from "@/lib/analytics";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Skeleton } from "@/components/ui/skeleton";

export default async function AnalyticsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  // Get internal user ID
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!user) return null;

  // Default date range: last 30 days
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);

  // Fetch initial data
  const [overview, growthData, postPerformance] = await Promise.all([
    getAnalyticsOverview(user.id, { start, end }),
    getFollowerGrowthData(user.id, { start, end }),
    getPostPerformanceData(user.id, { start, end }),
  ]);

  return (
    <div className="flex-1 overflow-y-auto bg-background/50">
      <DashboardHeader title="Analytics" />
      <div className="p-7">
        <Suspense fallback={<AnalyticsLoading />}>
          <AnalyticsClient 
            initialOverview={overview}
            initialGrowthData={growthData}
            initialPostPerformance={postPerformance}
            userId={user.id}
          />
        </Suspense>
      </div>
    </div>
  );
}

function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[400px] w-full rounded-2xl" />
      <Skeleton className="h-[500px] w-full rounded-2xl" />
    </div>
  );
}
