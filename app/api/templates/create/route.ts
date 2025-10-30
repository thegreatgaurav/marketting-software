import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { ensureSheetTab, appendToSheet } from '@/lib/googleSheets';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function handler(req: NextRequest) {
  try {
    const { name, content, type = 'whatsapp' } = await req.json();
    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    await ensureSheetTab('Templates', ['ID', 'Name', 'Content', 'Type', 'CreatedAt']);

    const id = generateId();
    const createdAt = new Date().toISOString();

    await appendToSheet('Templates', [id, name, content, type, createdAt]);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
