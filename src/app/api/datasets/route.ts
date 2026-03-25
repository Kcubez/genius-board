import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyUserSession } from '@/lib/user-auth';
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

export async function GET() {
  try {
    const session = await verifyUserSession();
    if (!session) return NextResponse.json({ success: false }, { status: 401 });
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
        recommendations: true,
      },
    });
    return NextResponse.json({ success: true, datasets });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifyUserSession();
    if (!session) return NextResponse.json({ success: false }, { status: 401 });

    const body = await request.json();
    const { name, fileName, columns, rows, chunkedUpload, totalRows } = body;

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

    const dataset = await prisma.dataset.create({
      data: {
        userId: session.userId,
        name,
        fileName,
        columns,
        rowCount: chunkedUpload ? totalRows || 0 : rows.length,
      },
    });

    if (!chunkedUpload && rows) {
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
      generateAndSaveAllRecommendations(dataset.id, rows, columns).catch(err => console.error(err));
    }

    return NextResponse.json({ success: true, dataset });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
