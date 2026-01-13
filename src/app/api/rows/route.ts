import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyUserSession } from '@/lib/user-auth';

type JsonValue = Prisma.InputJsonValue;

// POST create new row in a dataset
export async function POST(request: Request) {
  try {
    const session = await verifyUserSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { datasetId, data } = body;

    if (!datasetId || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user owns this dataset
    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId, userId: session.userId },
    });

    if (!dataset) {
      return NextResponse.json({ success: false, error: 'Dataset not found' }, { status: 404 });
    }

    // Get the max row index for this dataset
    const maxRow = await prisma.dataRow.findFirst({
      where: { datasetId },
      orderBy: { rowIndex: 'desc' },
      select: { rowIndex: true },
    });

    const newRowIndex = (maxRow?.rowIndex ?? -1) + 1;

    const row = await prisma.dataRow.create({
      data: {
        datasetId,
        rowIndex: newRowIndex,
        data: data as JsonValue,
      },
    });

    // Update row count
    await prisma.dataset.update({
      where: { id: datasetId },
      data: { rowCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, row });
  } catch (error) {
    console.error('Error creating row:', error);
    return NextResponse.json({ success: false, error: 'Failed to create row' }, { status: 500 });
  }
}
