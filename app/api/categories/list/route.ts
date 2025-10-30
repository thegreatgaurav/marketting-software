import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { ensureSheetTab, getSheetData } from '@/lib/googleSheets';

async function handler(req: NextRequest) {
  try {
    await ensureSheetTab('Categories', ['ID', 'Name', 'Description', 'CreatedAt']);
    const categories = await getSheetData('Categories');
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
