import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.USER_JWT_SECRET || 'user-secret-key-change-in-production'
);

// Helper to get current user from JWT token
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

// POST - Submit survey response
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { type, message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: user?.id || null,
        userEmail: user?.email || null,
        type: type || 'survey',
        message: message.trim(),
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        type: feedback.type,
        message: feedback.message,
        status: feedback.status,
        createdAt: feedback.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Check if user has already answered survey, or get feedback history
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const check = searchParams.get('check');

    // Check if user already submitted a survey
    if (check === 'true') {
      const existing = await prisma.feedback.findFirst({
        where: {
          userId: user.id,
          type: 'survey',
        },
      });

      return NextResponse.json({
        success: true,
        hasAnswered: !!existing,
      });
    }

    // Otherwise return full feedback history
    const feedbackList = await prisma.feedback.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const feedback = feedbackList.map(row => ({
      id: row.id,
      type: row.type,
      message: row.message,
      response: row.response,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
