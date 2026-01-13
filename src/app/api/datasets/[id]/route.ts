import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserSession } from '@/lib/user-auth';

// GET dataset with all rows (only if user owns it)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifyUserSession();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const dataset = await prisma.dataset.findFirst({
      where: { id, userId: session.userId },
      include: {
        rows: {
          orderBy: { rowIndex: 'asc' },
        },
      },
    });

    if (!dataset) {
      return NextResponse.json({ success: false, error: 'Dataset not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, dataset });
  } catch (error) {
    console.error('Error fetching dataset:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dataset' }, { status: 500 });
  }
}

// DELETE dataset and all its rows (only if user owns it)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifyUserSession();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership before deleting
    const dataset = await prisma.dataset.findFirst({
      where: { id, userId: session.userId },
    });

    if (!dataset) {
      return NextResponse.json({ success: false, error: 'Dataset not found' }, { status: 404 });
    }

    await prisma.dataset.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete dataset' },
      { status: 500 }
    );
  }
}

// PATCH update dataset name (only if user owns it)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifyUserSession();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership before updating
    const existing = await prisma.dataset.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Dataset not found' }, { status: 404 });
    }

    const dataset = await prisma.dataset.update({
      where: { id },
      data: { name: body.name },
    });

    return NextResponse.json({ success: true, dataset });
  } catch (error) {
    console.error('Error updating dataset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update dataset' },
      { status: 500 }
    );
  }
}
