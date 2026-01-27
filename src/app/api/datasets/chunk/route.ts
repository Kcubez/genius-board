import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyUserSession } from '@/lib/user-auth';

// Route segment config - Vercel Hobby plan max is 10 seconds
export const maxDuration = 10;
export const dynamic = 'force-dynamic';

type JsonValue = Prisma.InputJsonValue;

// POST upload a chunk of rows to an existing dataset
export async function POST(request: Request) {
  try {
    const session = await verifyUserSession();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { datasetId, rows, startIndex, isLastChunk } = body;

    if (!datasetId || !rows || startIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: datasetId, rows, startIndex' },
        { status: 400 }
      );
    }

    // Verify user owns this dataset
    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId, userId: session.userId },
    });

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset not found or access denied' },
        { status: 404 }
      );
    }

    // Insert rows in batch
    const BATCH_SIZE = 100;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await prisma.dataRow.createMany({
        data: batch.map((row: Record<string, unknown>, index: number) => ({
          datasetId,
          rowIndex: startIndex + i + index,
          data: row as JsonValue,
        })),
      });
    }

    // If this is the last chunk, update the final row count
    if (isLastChunk) {
      const actualRowCount = await prisma.dataRow.count({
        where: { datasetId },
      });

      await prisma.dataset.update({
        where: { id: datasetId },
        data: { rowCount: actualRowCount },
      });
    }

    return NextResponse.json({
      success: true,
      message: isLastChunk ? 'Upload complete' : 'Chunk uploaded',
      rowsInChunk: rows.length,
      startIndex,
    });
  } catch (error) {
    console.error('Error uploading chunk:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload chunk' }, { status: 500 });
  }
}
