import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyUserSession } from '@/lib/user-auth';

// Route segment config - Vercel Hobby plan max is 10 seconds
export const maxDuration = 10;
export const dynamic = 'force-dynamic';

type JsonValue = Prisma.InputJsonValue;

// GET all datasets for current user
export async function GET() {
  try {
    const session = await verifyUserSession();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const datasets = await prisma.dataset.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        fileName: true,
        rowCount: true,
        createdAt: true,
        columns: true,
      },
    });
    return NextResponse.json({ success: true, datasets });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

// POST create new dataset with rows
export async function POST(request: Request) {
  try {
    const session = await verifyUserSession();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, fileName, columns, rows, chunkedUpload, totalRows } = body;

    if (!name || !fileName || !columns) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For chunked uploads, create the dataset first without rows
    // Rows will be uploaded via /api/datasets/chunk
    if (chunkedUpload) {
      const dataset = await prisma.dataset.create({
        data: {
          userId: session.userId,
          name,
          fileName,
          columns,
          rowCount: totalRows || 0, // Will be updated when upload completes
        },
      });

      return NextResponse.json({
        success: true,
        dataset,
        message: 'Dataset created, ready for chunked upload',
      });
    }

    // For regular uploads (small datasets), include rows
    if (!rows) {
      return NextResponse.json(
        { success: false, error: 'Missing rows for non-chunked upload' },
        { status: 400 }
      );
    }

    const BATCH_SIZE = 500;

    // Create dataset with userId
    const dataset = await prisma.dataset.create({
      data: {
        userId: session.userId,
        name,
        fileName,
        columns,
        rowCount: rows.length,
      },
    });

    // Batch insert rows for better performance
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await prisma.dataRow.createMany({
        data: batch.map((row: Record<string, unknown>, index: number) => ({
          datasetId: dataset.id,
          rowIndex: i + index,
          data: row as JsonValue,
        })),
      });
    }

    return NextResponse.json({ success: true, dataset });
  } catch (error) {
    console.error('Error creating dataset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create dataset' },
      { status: 500 }
    );
  }
}
