import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserSession } from '@/lib/user-auth';
import { fetchSheetData, computeSyncDiff } from '@/lib/google-sheets';
import { ColumnInfo } from '@/types/csv';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await verifyUserSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { datasetId } = body;

    if (!datasetId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: datasetId' },
        { status: 400 }
      );
    }

    // Fetch dataset — must belong to user and be a Google Sheets source
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: datasetId,
        userId: session.userId,
      },
    });

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset not found' },
        { status: 404 }
      );
    }

    if (dataset.source !== 'google_sheets') {
      return NextResponse.json(
        { success: false, error: 'This dataset is not linked to Google Sheets' },
        { status: 400 }
      );
    }

    if (!dataset.sheetId || !dataset.sheetTabName) {
      return NextResponse.json(
        { success: false, error: 'Dataset is missing Google Sheets metadata (sheetId or tabName)' },
        { status: 400 }
      );
    }

    // Fetch latest data from Google Sheets
    const result = await fetchSheetData(dataset.sheetId, dataset.sheetTabName);

    if (!result.success || !result.data) {
      const statusMap: Record<string, number> = {
        AUTH_ERROR: 403,
        NOT_FOUND: 404,
        RATE_LIMIT: 429,
        EMPTY_SHEET: 422,
        API_KEY_MISSING: 500,
        NETWORK_ERROR: 502,
      };
      const status = result.errorCode ? statusMap[result.errorCode] || 500 : 500;
      return NextResponse.json(
        { success: false, error: result.error, errorCode: result.errorCode },
        { status }
      );
    }

    // Fetch existing rows from database
    const existingRows = await prisma.dataRow.findMany({
      where: { datasetId },
      select: { id: true, rowIndex: true, data: true },
    });

    const existingColumns = (dataset.columns || []) as unknown as ColumnInfo[];
    const newColumns = result.data.columns;
    const newRows = result.data.rows;

    // Compute diff
    const diff = computeSyncDiff(
      existingRows.map(r => ({
        id: r.id,
        rowIndex: r.rowIndex,
        data: r.data as Record<string, unknown>,
      })),
      newRows,
      existingColumns,
      newColumns
    );

    const { added, updated, deleted, columnsChanged, rowsToAdd, rowsToUpdate, rowIdsToDelete, updatedColumns } = diff;

    // If no changes, just update lastSyncedAt
    if (added === 0 && updated === 0 && deleted === 0 && !columnsChanged) {
      await prisma.dataset.update({
        where: { id: datasetId },
        data: { lastSyncedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        changes: { added: 0, updated: 0, deleted: 0, columnsChanged: false },
        lastSyncedAt: new Date(),
      });
    }

    // Apply changes atomically using a Prisma transaction
    const now = new Date();

    await prisma.$transaction(
      async (tx) => {
        // Delete removed rows
        if (rowIdsToDelete.length > 0) {
          await tx.dataRow.deleteMany({
            where: { id: { in: rowIdsToDelete } },
          });
        }

        // Update changed rows in parallel to minimize round-trip latencies
        if (rowsToUpdate.length > 0) {
          await Promise.all(
            rowsToUpdate.map(row =>
              tx.dataRow.update({
                where: { id: row.id },
                data: { data: row.data as any, rowIndex: row.rowIndex },
              })
            )
          );
        }

        // Add new rows in batches
        if (rowsToAdd.length > 0) {
          const BATCH_SIZE = 500;
          for (let i = 0; i < rowsToAdd.length; i += BATCH_SIZE) {
            const batch = rowsToAdd.slice(i, i + BATCH_SIZE);
            await tx.dataRow.createMany({
              data: batch.map(row => ({
                datasetId,
                rowIndex: row.rowIndex,
                data: row.data as any,
              })),
            });
          }
        }

        // Update dataset metadata
        await tx.dataset.update({
          where: { id: datasetId },
          data: {
            ...(columnsChanged ? { columns: updatedColumns as any } : {}),
            rowCount: newRows.length,
            lastSyncedAt: now,
            lastModifiedAt: now,
          },
        });
      },
      {
        maxWait: 10000, // 10s wait time for connection acquisition
        timeout: 30000, // 30s execution timeout
      }
    );

    return NextResponse.json({
      success: true,
      changes: { added, updated, deleted, columnsChanged },
      lastSyncedAt: now,
    });
  } catch (error) {
    console.error('[API] POST /api/sheets/sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
