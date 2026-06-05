import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserSession } from '@/lib/user-auth';

export async function GET() {
  try {
    const session = await verifyUserSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { geminiKey: true },
    });

    return NextResponse.json({
      success: true,
      geminiKey: user?.geminiKey || '',
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get settings' }, { status: 500 });
  }
}
