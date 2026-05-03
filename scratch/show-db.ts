import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import { decrypt } from '../lib/encryption';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function showDb() {
  try {
    const allUsers = await db.select().from(schema.users);
    console.log('\n--- USERS TABLE ---');
    console.log(JSON.stringify(allUsers, null, 2));

    const allAccounts = await db.select().from(schema.connectedAccounts);
    console.log('\n--- CONNECTED ACCOUNTS TABLE ---');
    
    const displayAccounts = allAccounts.map(account => {
      let decryptedToken;
      try {
        decryptedToken = account.accessToken ? decrypt(account.accessToken) : 'null';
      } catch (e) {
        decryptedToken = 'Failed to decrypt';
      }

      return {
        ...account,
        _accessTokenEncryptedValue: account.accessToken,
        _accessTokenDecryptedSnippet: typeof decryptedToken === 'string' ? decryptedToken.substring(0, 20) + '...' : 'null',
      };
    });
    
    console.log(JSON.stringify(displayAccounts, null, 2));

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

showDb();
