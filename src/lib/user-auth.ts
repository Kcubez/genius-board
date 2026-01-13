import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const USER_JWT_SECRET = new TextEncoder().encode(
  process.env.USER_JWT_SECRET || 'user-secret-key-change-in-production'
);

// Helper to verify user session and get user data
export async function verifyUserSession(): Promise<{
  userId: string;
  email: string;
  name: string | null;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token')?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, USER_JWT_SECRET);
    const userId = payload.userId as string;

    // Verify user is still active and within date range
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || user.isAdmin) {
      return null;
    }

    // Check date validity
    const now = new Date();
    if (user.startDate && new Date(user.startDate) > now) {
      return null;
    }
    if (user.endDate && new Date(user.endDate) < now) {
      return null;
    }

    return { userId: user.id, email: user.email, name: user.name };
  } catch {
    return null;
  }
}
