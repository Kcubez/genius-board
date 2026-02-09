import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production'
);

// Verify admin token helper
async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || !user.isAdmin) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

// GET - Get all feedback (admin only)
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin();

    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Build where clause
    const where: Record<string, string> = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (type && type !== 'all') {
      where.type = type;
    }

    const feedbackList = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const feedback = feedbackList.map(row => ({
      id: row.id,
      userId: row.userId,
      userEmail: row.userEmail,
      type: row.type,
      message: row.message,
      response: row.response,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error('Admin feedback API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
