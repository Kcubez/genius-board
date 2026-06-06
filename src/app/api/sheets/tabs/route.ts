import { NextResponse } from 'next/server';
import { extractSpreadsheetId, fetchSheetTabs } from '@/lib/google-sheets';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Missing "url" query parameter' },
        { status: 400 }
      );
    }

    const spreadsheetId = extractSpreadsheetId(url);
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'Invalid Google Sheets URL. Please provide a valid link.' },
        { status: 400 }
      );
    }

    const result = await fetchSheetTabs(spreadsheetId);

    if (!result.success) {
      const statusMap: Record<string, number> = {
        AUTH_ERROR: 403,
        NOT_FOUND: 404,
        RATE_LIMIT: 429,
        API_KEY_MISSING: 500,
        NETWORK_ERROR: 502,
      };
      const status = result.errorCode ? statusMap[result.errorCode] || 500 : 500;
      return NextResponse.json(
        { success: false, error: result.error, errorCode: result.errorCode },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      tabs: result.tabs,
      spreadsheetId,
    });
  } catch (error) {
    console.error('[API] GET /api/sheets/tabs error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
