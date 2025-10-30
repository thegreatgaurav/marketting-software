import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { ensureSheetTab, appendToSheet } from '@/lib/googleSheets';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function handler(req: NextRequest) {
  try {
    const { name, phone, category = '', tags = [], notes = '' } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    await ensureSheetTab('Contacts', ['ID', 'Name', 'Phone', 'Category', 'Tags', 'Notes', 'CreatedAt']);

    const id = generateId();
    const createdAt = new Date().toISOString();
    const tagsString = Array.isArray(tags) ? tags.join(',') : String(tags || '');

    await appendToSheet('Contacts', [id, name, phone, category, tagsString, notes, createdAt]);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create contact' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
