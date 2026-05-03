
import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../db';
import { autoReplyRules, autoReplyLogs, postPlatformResults } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

async function main() {
  console.log("--- Active Rules ---");
  const rules = await db.select().from(autoReplyRules).where(eq(autoReplyRules.isActive, true));
  console.log(JSON.stringify(rules, null, 2));

  console.log("\n--- Recent Logs ---");
  const logs = await db.select().from(autoReplyLogs).orderBy(desc(autoReplyLogs.createdAt)).limit(5);
  console.log(JSON.stringify(logs, null, 2));

  console.log("\n--- Recent Published Posts (FB/IG) ---");
  const posts = await db.select().from(postPlatformResults)
    .where(eq(postPlatformResults.status, 'PUBLISHED'))
    .orderBy(desc(postPlatformResults.publishedAt))
    .limit(5);
  console.log(JSON.stringify(posts, null, 2));
}

main().catch(console.error);
