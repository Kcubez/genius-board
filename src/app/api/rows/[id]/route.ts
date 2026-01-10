import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type JsonValue = Prisma.InputJsonValue;

// GET single row
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const row = await prisma.dataRow.findUnique({
      where: { id },
    });

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
    const { id } = await params;
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
    const { id } = await params;

    // Get row to find datasetId
    const row = await prisma.dataRow.findUnique({
      where: { id },
      select: { datasetId: true },
    });

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
