import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyUserSession } from '@/lib/user-auth';

type JsonValue = Prisma.InputJsonValue;

// Helper to check if user owns the row's dataset
async function verifyRowOwnership(rowId: string, userId: string) {
  const row = await prisma.dataRow.findUnique({
    where: { id: rowId },
    include: { dataset: { select: { userId: true } } },
  });

  if (!row || row.dataset.userId !== userId) {
    return null;
  }
  return row;
}

// GET single row
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifyUserSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const row = await verifyRowOwnership(id, session.userId);

    if (!row) {
      return NextResponse.json({ success: false, error: 'Row not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, row });
  } catch (error) {
    console.error('Error fetching row:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch row' }, { status: 500 });
  }
}

// PATCH update row data
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifyUserSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await verifyRowOwnership(id, session.userId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Row not found' }, { status: 404 });
    }

    const body = await request.json();
    const row = await prisma.dataRow.update({
      where: { id },
      data: { data: body.data as JsonValue },
    });

    return NextResponse.json({ success: true, row });
  } catch (error) {
    console.error('Error updating row:', error);
    return NextResponse.json({ success: false, error: 'Failed to update row' }, { status: 500 });
  }
}

// DELETE row
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifyUserSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const row = await verifyRowOwnership(id, session.userId);
    if (!row) {
      return NextResponse.json({ success: false, error: 'Row not found' }, { status: 404 });
    }

    await prisma.dataRow.delete({
      where: { id },
    });

    // Update row count
    await prisma.dataset.update({
      where: { id: row.datasetId },
      data: { rowCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting row:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete row' }, { status: 500 });
  }
}
