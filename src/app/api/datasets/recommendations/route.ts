import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────
export interface AiRecommendation {
  id: string;
  type: 'regional' | 'product' | 'time' | 'customer' | 'payment' | 'general';
  priority: 'high' | 'medium' | 'low';
  metric: string; // The data/number part
  en: {
    title: string;
    description: string;
    insight: string;
  };
  mm: {
    title: string;
    description: string;
    insight: string;
  };
}

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { verifyUserSession } from '@/lib/user-auth';

export async function POST(req: NextRequest) {
  try {
    const session = await verifyUserSession();
    if (!session)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    let apiKey = (session.geminiKey || process.env.GEMINI_API_KEY || '').trim();
    // 🛡️ Safety: Remove any non-ASCII characters that might break ByteString conversion
    apiKey = apiKey.replace(/[^\x00-\x7F]/g, '');

    if (!apiKey)
      return NextResponse.json(
        {
          success: false,
          error: 'API Key missing. Please provide your Gemini API key in login page or re-login.',
        },
        { status: 500 }
      );

    const body = await req.json();
    const { dataSummary, datasetId } = body;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `Analyze this dataset summary and provide 4-8 actionable business recommendations.
    Summary: ${dataSummary}

    ## Response Format (STRICT JSON ARRAY):
    Return a JSON array of objects. Each object represents ONE recommendation:
    {
      "type": "regional" | "product" | "time" | "customer" | "payment" | "general",
      "priority": "high" | "medium" | "low",
      "metric": "A key metric or value (e.g. 15% increase, 500 orders)",
      "en": {
        "title": "Short title in English",
        "insight": "Data-backed insight in English",
        "description": "Specific actionable advice in English"
      },
      "mm": {
        "title": "Short title in Myanmar",
        "insight": "Data-backed insight in Myanmar",
        "description": "Specific actionable advice in Myanmar"
      }
    }

    IMPORTANT: Priority and Type MUST be identical for both languages.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = JSON.parse(text.trim());

    // Transform to our cache format: { en: [...], mm: [...] }
    const recommendationsCache = {
      en: parsed.map((item: any, i: number) => ({
        id: `rec-${i}-${Date.now()}`,
        type: item.type,
        priority: item.priority,
        metric: item.metric,
        ...item.en,
      })),
      mm: parsed.map((item: any, i: number) => ({
        id: `rec-${i}-${Date.now()}`,
        type: item.type,
        priority: item.priority,
        metric: item.metric,
        ...item.mm,
      })),
    };

    if (datasetId) {
      await prisma.dataset.update({
        where: { id: datasetId },
        data: {
          recommendations: recommendationsCache as any,
          lastAiGeneratedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, recommendations: recommendationsCache });
  } catch (error: any) {
    console.error('API Error:', error);
    const errorMessage = error?.message?.includes('429')
      ? 'Gemini API limit reached. Please provide a new API key in the login page and re-upload your file.'
      : 'Failed to generate recommendations. Please check your Gemini API key or re-upload the file.';

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
