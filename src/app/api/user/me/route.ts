import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// GET current user's profile (for Supabase authenticated users)
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Find user in our database by email
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if user is active and within valid date range
    const now = new Date();
    const isWithinDateRange =
      (!dbUser.startDate || new Date(dbUser.startDate) <= now) &&
      (!dbUser.endDate || new Date(dbUser.endDate) >= now);

    if (!dbUser.isActive || !isWithinDateRange) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account is not active or access period has expired',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        isActive: dbUser.isActive,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
