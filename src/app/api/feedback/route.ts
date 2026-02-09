import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { KNOWN_FEATURES } from '@/types/feedback';
import { Feedback } from '@prisma/client';

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

// POST - Submit new feedback
export async function POST(request: Request) {
  try {
    // Get current user (optional - guests can also submit)
    const user = await getCurrentUser();

    const body = await request.json();
    const { type, message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    // Check if the message matches any known feature (for auto-reply)
    let autoResponse: string | null = null;
    const lowerMessage = message.toLowerCase();

    for (const feature of KNOWN_FEATURES) {
      const hasMatch = feature.keywords.some(keyword => lowerMessage.includes(keyword));
      if (hasMatch) {
        autoResponse = `✅ **${feature.feature}** is available!\n\n${feature.description}`;
        break;
      }
    }

    // If no feature matched and it's a feature inquiry, give a default response
    if (!autoResponse && type === 'feature_inquiry') {
      autoResponse =
        "🔍 I couldn't find a matching feature for your question. Your inquiry has been recorded and our team will review it. In the meantime, feel free to explore the dashboard!";
    }

    // Insert feedback into database using Prisma
    const feedback = await prisma.feedback.create({
      data: {
        userId: user?.id || null,
        userEmail: user?.email || null,
        type: type || 'general',
        message: message.trim(),
        response: autoResponse,
        status: autoResponse ? 'reviewed' : 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        type: feedback.type,
        message: feedback.message,
        response: feedback.response,
        status: feedback.status,
        createdAt: feedback.createdAt.toISOString(),
      },
      autoResponse,
    });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get user's own feedback history
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const feedbackList = await prisma.feedback.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const feedback = feedbackList.map((row: Feedback) => ({
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
