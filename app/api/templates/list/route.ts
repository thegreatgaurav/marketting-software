import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { ensureSheetTab, getSheetData } from '@/lib/googleSheets';

async function handler(req: NextRequest) {
  try {
    await ensureSheetTab('Templates', ['ID', 'Name', 'Content', 'Type', 'CreatedAt']);
    const templates = await getSheetData('Templates');
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
