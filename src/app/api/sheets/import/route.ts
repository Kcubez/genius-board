import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserSession } from '@/lib/user-auth';
import { extractSpreadsheetId, fetchSheetData } from '@/lib/google-sheets';
import { buildDataSummary } from '@/lib/ai-recommendations';
import { ColumnInfo } from '@/types/csv';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

async function generateAndSaveAllRecommendations(
  datasetId: string,
  rows: Record<string, string | number | Date | null>[],
  columns: ColumnInfo[]
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  try {
    const dataSummary = buildDataSummary(rows, columns);
    if (!dataSummary) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze this dataset and provide 4-8 business recommendations in BOTH English and Myanmar.
    Summary: ${dataSummary}
    
    IMPORTANT: You MUST ONLY useThese types: "regional", "product", "time", "customer", "payment", "general".
    
    Response format (JSON ONLY):
    {
      "en": [{ "type": "regional" | "product" | "time" | "customer" | "payment" | "general", "priority": "high" | "medium" | "low", "title": "...", "description": "...", "insight": "...", "metric": "...", "icon": "..." }],
      "mm": [{ "type": "same as above", "priority": "same as above", "title": "...", "description": "...", "insight": "...", "metric": "...", "icon": "..." }]
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
    else if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);
    cleanText = cleanText.trim();

    const jsonResponse = JSON.parse(cleanText);

    const validate = (list: any[]) =>
      (list || []).map((r: any, i: number) => ({
        ...r,
        id: `rec-${i}`,
        type: ['regional', 'product', 'time', 'customer', 'payment', 'general'].includes(r.type)
          ? r.type
          : 'general',
        priority: ['high', 'medium', 'low'].includes(r.priority) ? r.priority : 'medium',
      }));

    const recommendations = {
      en: validate(jsonResponse.en),
      mm: validate(jsonResponse.mm),
    };

    await prisma.dataset.update({
      where: { id: datasetId },
      data: { recommendations: recommendations as any },
    });
  } catch (error) {
    console.error('AI generation failed:', error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifyUserSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, tabName, tabGid, datasetName, syncInterval = 10, syncEnabled = true } = body;

    if (!url || !tabName || !datasetName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: url, tabName, datasetName' },
        { status: 400 }
      );
    }

    // 🔒 Limit: Only 2 files per user
    const existingCount = await prisma.dataset.count({
      where: { userId: session.userId },
    });

    if (existingCount >= 2) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Free tier limit reached: You can only upload up to 2 reports. Please delete an existing report to upload a new one.',
        },
        { status: 403 }
      );
    }

    const spreadsheetId = extractSpreadsheetId(url);
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'Invalid Google Sheets URL. Please provide a valid link.' },
        { status: 400 }
      );
    }

    // Fetch ALL rows from the sheet
    const result = await fetchSheetData(spreadsheetId, tabName);

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

    const { columns, rows, totalRows } = result.data;

    // Create dataset with Google Sheets metadata
    const dataset = await prisma.dataset.create({
      data: {
        userId: session.userId,
        name: datasetName,
        fileName: `${tabName} (Google Sheets)`,
        columns: columns as any,
        rowCount: totalRows,
        source: 'google_sheets',
        sheetId: spreadsheetId,
        sheetUrl: url,
        sheetTabName: tabName,
        sheetTabGid: tabGid !== undefined && tabGid !== null ? String(tabGid) : null,
        syncInterval,
        syncEnabled,
        lastSyncedAt: new Date(),
      },
    });

    // Insert data rows in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await prisma.dataRow.createMany({
        data: batch.map((row: any, index: number) => ({
          datasetId: dataset.id,
          rowIndex: i + index,
          data: row as any,
        })),
      });
    }

    // Generate AI recommendations in the background
    generateAndSaveAllRecommendations(dataset.id, rows, columns).catch(err =>
      console.error('[Sheets Import] AI recommendation error:', err)
    );

    return NextResponse.json({ success: true, dataset });
  } catch (error) {
    console.error('[API] POST /api/sheets/import error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
