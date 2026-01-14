import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserSession } from '@/lib/user-auth';

// POST - Apply cleaned data to dataset
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifyUserSession();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { cleanedData } = await request.json();

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

    // Start a transaction to replace all rows with cleaned data
    await prisma.$transaction(async tx => {
      // Delete all existing rows
      await tx.dataRow.deleteMany({
        where: { datasetId: id },
      });

      // Insert cleaned rows
      if (cleanedData.length > 0) {
        await tx.dataRow.createMany({
          data: cleanedData.map((row: Record<string, unknown>, index: number) => ({
            datasetId: id,
            rowIndex: index,
            data: row as object,
          })),
        });
      }

      // Update the dataset row count
      await tx.dataset.update({
        where: { id },
        data: { rowCount: cleanedData.length },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Data cleaned successfully',
      newRowCount: cleanedData.length,
    });
  } catch (error) {
    console.error('Error applying cleaned data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to apply cleaned data' },
      { status: 500 }
    );
  }
}
