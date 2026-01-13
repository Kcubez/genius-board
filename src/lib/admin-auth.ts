import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production'
);

// Helper to verify admin session
export async function verifyAdminSession(): Promise<{ userId: string; email: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    // Verify user is still admin and active
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || !user.isAdmin) {
      return null;
    }

    return { userId: user.id, email: user.email };
  } catch {
    return null;
  }
}
