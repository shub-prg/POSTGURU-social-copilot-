import { db } from "@/db";
import { analyticsSnapshots, postAnalyticsSnapshots, posts, postPlatformResults } from "@/db/schema";
import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm";
import { calculateEngagementRate } from "./utils";

export async function getAnalyticsOverview(userId: string, dateRange: { start: Date; end: Date }) {
  // 1. Get the most recent snapshot for the current period
  const currentSnapshots = await db.query.analyticsSnapshots.findMany({
    where: and(
      eq(analyticsSnapshots.userId, userId),
      gte(analyticsSnapshots.snapshotDate, dateRange.start),
      lte(analyticsSnapshots.snapshotDate, dateRange.end)
    ),
    orderBy: [desc(analyticsSnapshots.snapshotDate)],
  });

  // 2. Get the snapshots for the previous period for comparison
  const duration = dateRange.end.getTime() - dateRange.start.getTime();
  const prevStart = new Date(dateRange.start.getTime() - duration);
  const prevEnd = new Date(dateRange.end.getTime() - duration);

  const previousSnapshots = await db.query.analyticsSnapshots.findMany({
    where: and(
      eq(analyticsSnapshots.userId, userId),
      gte(analyticsSnapshots.snapshotDate, prevStart),
      lte(analyticsSnapshots.snapshotDate, prevEnd)
    ),
    orderBy: [desc(analyticsSnapshots.snapshotDate)],
  });

  // Process data...
  // For simplicity, we aggregate latest values per platform
  const latestByPlatform: Record<string, any> = {};
  currentSnapshots.forEach(s => {
    if (!latestByPlatform[s.platform]) {
      latestByPlatform[s.platform] = s;
    }
  });

  const prevByPlatform: Record<string, any> = {};
  previousSnapshots.forEach(s => {
    if (!prevByPlatform[s.platform]) {
      prevByPlatform[s.platform] = s;
    }
  });

  // Calculate totals
  const totalFollowers = Object.values(latestByPlatform).reduce((acc, s) => acc + (s.followersCount || 0), 0);
  const prevFollowers = Object.values(prevByPlatform).reduce((acc, s) => acc + (s.followersCount || 0), 0);



  // For Reach, Impressions, Engagements, we need to sum up post-level snapshots in that period
  const userPostIdsSubquery = db.select({ id: posts.id }).from(posts).where(eq(posts.userId, userId));

  const postSnapshots = await db.query.postAnalyticsSnapshots.findMany({
    where: and(
      inArray(postAnalyticsSnapshots.postId, userPostIdsSubquery),
      gte(postAnalyticsSnapshots.snapshotDate, dateRange.start),
      lte(postAnalyticsSnapshots.snapshotDate, dateRange.end)
    ),
  });

  const prevPostSnapshots = await db.query.postAnalyticsSnapshots.findMany({
    where: and(
      inArray(postAnalyticsSnapshots.postId, userPostIdsSubquery),
      gte(postAnalyticsSnapshots.snapshotDate, prevStart),
      lte(postAnalyticsSnapshots.snapshotDate, prevEnd)
    ),
  });

  // We need to be careful not to double count. We want the cumulative metrics for the period.
  // Actually, for "Total Reach", we should sum the latest reach of each post published in that period?
  // Or just sum all engagement actions in that period.
  
  const aggregateMetrics = (snapshots: any[]) => {
    // Get unique posts in this set
    const postIds = new Set(snapshots.map(s => s.postId));
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalViews = 0;

    // For each post, get its latest snapshot within this period
    postIds.forEach(id => {
      const postSnaps = snapshots.filter(s => s.postId === id).sort((a, b) => b.snapshotDate.getTime() - a.snapshotDate.getTime());
      const latest = postSnaps[0];
      totalLikes += (latest.likesCount || 0);
      totalComments += (latest.commentsCount || 0);
      totalShares += (latest.sharesCount || 0);
      totalViews += (latest.viewsCount || 0);
    });

    return { totalLikes, totalComments, totalShares, totalViews };
  };

  const currentMetrics = aggregateMetrics(postSnapshots);
  const prevMetrics = aggregateMetrics(prevPostSnapshots);

  const totalEngagements = currentMetrics.totalLikes + currentMetrics.totalComments + currentMetrics.totalShares;
  const prevEngagements = prevMetrics.totalLikes + prevMetrics.totalComments + prevMetrics.totalShares;

  const avgEngagementRate = calculateEngagementRate({
    likes: currentMetrics.totalLikes,
    comments: currentMetrics.totalComments,
    shares: currentMetrics.totalShares,
    followers: totalFollowers,
  });

  const prevEngagementRate = calculateEngagementRate({
    likes: prevMetrics.totalLikes,
    comments: prevMetrics.totalComments,
    shares: prevMetrics.totalShares,
    followers: prevFollowers,
  });

  return {
    followers: { value: totalFollowers, prev: prevFollowers },
    engagements: { value: totalEngagements, prev: prevEngagements },
    impressions: { value: currentMetrics.totalViews, prev: prevMetrics.totalViews },
    engagementRate: { value: avgEngagementRate, prev: prevEngagementRate },
  };
}

export async function getFollowerGrowthData(userId: string, dateRange: { start: Date; end: Date }) {
  const snapshots = await db.query.analyticsSnapshots.findMany({
    where: and(
      eq(analyticsSnapshots.userId, userId),
      gte(analyticsSnapshots.snapshotDate, dateRange.start),
      lte(analyticsSnapshots.snapshotDate, dateRange.end)
    ),
    orderBy: [analyticsSnapshots.snapshotDate],
  });

  // Group by date and platform
  const data: Record<string, any> = {};
  snapshots.forEach(s => {
    const date = s.snapshotDate.toISOString().split('T')[0];
    if (!data[date]) data[date] = { date };
    data[date][s.platform] = s.followersCount;
  });

  return Object.values(data);
}

export async function getPostPerformanceData(userId: string, dateRange: { start: Date; end: Date }) {
  // Fetch posts and their latest metrics
  const userPosts = await db.query.posts.findMany({
    where: and(
      eq(posts.userId, userId),
      gte(posts.createdAt, dateRange.start),
      lte(posts.createdAt, dateRange.end)
    ),
    with: {
      results: true,
      analyticsSnapshots: {
        orderBy: [desc(postAnalyticsSnapshots.snapshotDate)],
        limit: 10, // Get enough to pick latest per platform
      },
    },
  });

  return userPosts.map(post => {
    // For each platform this post was on, get the latest snapshot
    const platforms: Record<string, any> = {};
    post.results.forEach(r => {
      const latestSnap = post.analyticsSnapshots.find(s => s.platform === r.platform);
      platforms[r.platform] = {
        likes: latestSnap?.likesCount || 0,
        comments: latestSnap?.commentsCount || 0,
        shares: latestSnap?.sharesCount || 0,
        reach: latestSnap?.viewsCount || 0,
        engagementRate: latestSnap?.engagementRate || "0",
      };
    });

    return {
      id: post.id,
      content: post.content,
      mediaUrls: post.mediaUrls,
      publishedAt: post.createdAt,
      platforms,
    };
  });
}
