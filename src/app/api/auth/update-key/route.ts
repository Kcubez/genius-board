import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserSession } from '@/lib/user-auth';

export async function POST(req: NextRequest) {
  try {
    const session = await verifyUserSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { geminiKey } = await req.json();
    if (!geminiKey) {
      return NextResponse.json({ success: false, error: 'API Key is required' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { geminiKey },
    });

    return NextResponse.json({ success: true, message: 'API Key updated' });
  } catch (error) {
    console.error('Update key error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update key' }, { status: 500 });
  }
}
