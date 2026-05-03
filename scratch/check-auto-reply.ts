import "dotenv/config";
import { db } from "../db";
import { autoReplyRules, postPlatformResults } from "../db/schema";
import { eq, and, gt, sql } from "drizzle-orm";

async function checkStatus() {
  console.log("--- Checking Auto-Reply Status ---");
  
  const rules = await db.query.autoReplyRules.findMany({
    where: eq(autoReplyRules.isActive, true),
  });
  console.log(`Active Rules: ${rules.length}`);
  rules.forEach(r => console.log(`- Rule: ${r.name}, Trigger: ${r.triggerType}, Platforms: ${JSON.stringify(r.platforms)}`));

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const recentPosts = await db.query.postPlatformResults.findMany({
    where: and(
      eq(postPlatformResults.status, "PUBLISHED"),
      gt(postPlatformResults.publishedAt, fortyEightHoursAgo),
      sql`${postPlatformResults.platform} IN ('FACEBOOK', 'INSTAGRAM')`
    ),
  });
  console.log(`Recent FB/IG Posts (last 48h): ${recentPosts.length}`);
  recentPosts.forEach(p => console.log(`- Post ID: ${p.id}, Platform: ${p.platform}, Published: ${p.publishedAt}`));
  
  process.exit(0);
}

checkStatus().catch(err => {
  console.error(err);
  process.exit(1);
});
