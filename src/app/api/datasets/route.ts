import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';

type JsonValue = Prisma.InputJsonValue;

// GET all datasets for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const datasets = await prisma.dataset.findMany({
      where: { userId: user.id },
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, fileName, columns, rows } = body;

    if (!name || !fileName || !columns || !rows) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const BATCH_SIZE = 500;

    // Create dataset with userId
    const dataset = await prisma.dataset.create({
      data: {
        userId: user.id,
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
