import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { ensureSheetTab, getSheetData } from '@/lib/googleSheets';

async function handler(req: NextRequest) {
  try {
    await ensureSheetTab('Contacts', ['ID', 'Name', 'Phone', 'Category', 'Tags', 'Notes', 'CreatedAt']);
    const contacts = await getSheetData('Contacts');
    return NextResponse.json({ contacts });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
