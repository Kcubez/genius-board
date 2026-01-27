import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserSession } from '@/lib/user-auth';

// Batch size for inserting rows
const BATCH_SIZE = 500;
// Max rows per request to stay under Vercel's 4.5MB limit
const MAX_ROWS_PER_REQUEST = 1000;

// POST - Apply cleaned data to dataset (supports chunked uploads)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifyUserSession();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    let body: {
      cleanedData?: Record<string, unknown>[];
      chunkIndex?: number;
      totalChunks?: number;
      totalRows?: number;
    };

    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Request body too large. Try with smaller dataset.' },
        { status: 400 }
      );
    }

    const { cleanedData, chunkIndex, totalChunks, totalRows } = body;

    if (!cleanedData || !Array.isArray(cleanedData)) {
      return NextResponse.json(
        { success: false, error: 'Invalid cleaned data format' },
        { status: 400 }
      );
    }

    // Verify ownership before updating
    const dataset = await prisma.dataset.findFirst({
      where: { id, userId: session.userId },
    });

    if (!dataset) {
      return NextResponse.json({ success: false, error: 'Dataset not found' }, { status: 404 });
    }

    const isChunkedUpload = chunkIndex !== undefined && totalChunks !== undefined;
    const isFirstChunk = chunkIndex === 0;
    const isLastChunk = chunkIndex === (totalChunks ?? 1) - 1;

    // For first chunk (or non-chunked upload), delete all existing rows
    if (isFirstChunk || !isChunkedUpload) {
      await prisma.dataRow.deleteMany({
        where: { datasetId: id },
      });
    }

    // Calculate starting row index for this chunk
    const startRowIndex = isChunkedUpload ? (chunkIndex ?? 0) * MAX_ROWS_PER_REQUEST : 0;

    // Insert cleaned rows in batches
    if (cleanedData.length > 0) {
      for (let i = 0; i < cleanedData.length; i += BATCH_SIZE) {
        const batch = cleanedData.slice(i, i + BATCH_SIZE);

        try {
          await prisma.dataRow.createMany({
            data: batch.map((row, index) => ({
              datasetId: id,
              rowIndex: startRowIndex + i + index,
              data: row as object,
            })),
          });
        } catch (batchError) {
          console.error(`Error inserting batch:`, batchError);
          // Continue with remaining batches
        }
      }
    }

    // Update row count only on last chunk or non-chunked upload
    if (isLastChunk || !isChunkedUpload) {
      const finalRowCount = totalRows ?? cleanedData.length;
      await prisma.dataset.update({
        where: { id },
        data: { rowCount: finalRowCount },
      });
    }

    return NextResponse.json({
      success: true,
      message: isChunkedUpload
        ? `Chunk ${(chunkIndex ?? 0) + 1}/${totalChunks} processed`
        : 'Data cleaned successfully',
      chunkIndex,
      isComplete: isLastChunk || !isChunkedUpload,
    });
  } catch (error) {
    console.error('Error applying cleaned data:', {
      error: error instanceof Error ? error.message : error,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to apply cleaned data' },
      { status: 500 }
    );
  }
}
