import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { ensureSheetTab, appendToSheet } from '@/lib/googleSheets';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function handler(req: NextRequest) {
  try {
    const { name, description = '' } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await ensureSheetTab('Categories', ['ID', 'Name', 'Description', 'CreatedAt']);

    const id = generateId();
    const createdAt = new Date().toISOString();

    await appendToSheet('Categories', [id, name, description, createdAt]);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
