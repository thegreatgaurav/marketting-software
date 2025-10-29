import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { getSheetData, ensureSheetTab } from '@/lib/googleSheets';

async function handler(req: NextRequest) {
  try {
    await ensureSheetTab('Leads', ['Name', 'Email', 'Phone', 'Message', 'Date', 'Status']);
    const leads = await getSheetData('Leads');
    
    return NextResponse.json({ leads });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
