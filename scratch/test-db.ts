import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

async function testQuery() {
  try {
    console.log('Testing query...');
    const result = await db.query.users.findFirst({
      where: eq(users.clerkId, 'test_id'),
    });
    console.log('Query successful:', result);
  } catch (error) {
    console.error('Query failed:', error);
  }
}

testQuery();
