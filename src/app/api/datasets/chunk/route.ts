import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyUserSession } from '@/lib/user-auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildDataSummary } from '@/lib/ai-recommendations';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

type JsonValue = Prisma.InputJsonValue;

// ─── Helper: Generate both EN and MM recommendations ──────────────────
async function generateAndSaveAllRecommendationsForDataset(datasetId: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      include: { rows: { take: 50, orderBy: { rowIndex: 'asc' } } },
    });

    if (!dataset || dataset.rows.length === 0) return;

    const rows = dataset.rows.map(r => r.data as Record<string, any>);
    const columns = dataset.columns as any;
    const dataSummary = buildDataSummary(rows, columns);
    if (!dataSummary) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze this dataset summary and provide 4-8 actionable recommendations in BOTH English and Myanmar.
    Summary: ${dataSummary}
    Response format: { "en": [...], "mm": [...] }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
    else if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);
    cleanText = cleanText.trim();

    const jsonResponse = JSON.parse(cleanText);
    const recommendations = {
      en: (jsonResponse.en || []).map((r: any, i: number) => ({ ...r, id: `rec-en-${i}` })),
      mm: (jsonResponse.mm || []).map((r: any, i: number) => ({ ...r, id: `rec-mm-${i}` })),
    };

    await prisma.dataset.update({
      where: { id: datasetId },
      data: {
        recommendations: recommendations as unknown as Prisma.InputJsonValue,
      },
    });

    console.log(`✅ Pre-generated all AI recommendations for chunked dataset ${datasetId}`);
  } catch (error) {
    console.error('Failed to pre-generate recommendations for chunked dataset:', error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifyUserSession();
    if (!session)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { datasetId, rows, isLastChunk } = body;

    // Batch insert rows
    await prisma.dataRow.createMany({
      data: rows.map((row: any, index: number) => ({
        datasetId,
        rowIndex: index, // In real world should handle true index
        data: row as JsonValue,
      })),
    });

    if (isLastChunk) {
      // 🤖 Trigger pre-generation for BOTH languages
      generateAndSaveAllRecommendationsForDataset(datasetId).catch(err =>
        console.error('Background generation failed:', err)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
