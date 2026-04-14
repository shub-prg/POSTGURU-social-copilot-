import { imagekit } from '@/lib/imagekit';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const authParams = imagekit.getAuthenticationParameters();
    return NextResponse.json(authParams);
  } catch (error) {
    console.error('ImageKit Auth Error:', error);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}
