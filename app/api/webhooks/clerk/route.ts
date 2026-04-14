import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error: Could not verify webhook:', err);
    return new Response('Error: Verification failed', {
      status: 400,
    });
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Received webhook with ID ${id} and event type of ${eventType}`);

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    
    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    if (!id || !email) {
      return new Response('Error: Missing user data', { status: 400 });
    }

    // Upsert user into database
    await db
      .insert(users)
      .values({
        clerkId: id,
        email: email,
        name: name || null,
        // Add imageUrl if you add it to schema, for now schema has name/email
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email: email,
          name: name || null,
          updatedAt: new Date(),
        },
      });

    return new Response('User synced successfully', { status: 200 });
  }

  return new Response('Webhook received', { status: 200 });
}
