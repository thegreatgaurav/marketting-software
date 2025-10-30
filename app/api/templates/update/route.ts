import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { ensureSheetTab, getSheetData, updateSheetRow } from '@/lib/googleSheets';

async function handler(req: NextRequest) {
  try {
    const { id, name, content, type } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await ensureSheetTab('Templates', ['ID', 'Name', 'Content', 'Type', 'CreatedAt']);

    const rows = await getSheetData('Templates');
    const rowIndex = rows.findIndex((r: any) => r.ID === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const current = rows[rowIndex];
    const newName = name ?? current.Name;
    const newContent = content ?? current.Content;
    const newType = type ?? current.Type;
    const createdAt = current.CreatedAt || new Date().toISOString();

    await updateSheetRow('Templates', rowIndex, [id, newName, newContent, newType, createdAt]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
