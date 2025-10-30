import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { ensureSheetTab, getSheetData, updateSheetRow } from '@/lib/googleSheets';

async function handler(req: NextRequest) {
  try {
    const { id, name, description } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await ensureSheetTab('Categories', ['ID', 'Name', 'Description', 'CreatedAt']);

    const rows = await getSheetData('Categories');
    const rowIndex = rows.findIndex((r: any) => r.ID === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const current = rows[rowIndex];
    const newName = name ?? current.Name;
    const newDesc = description ?? current.Description;
    const createdAt = current.CreatedAt || new Date().toISOString();

    await updateSheetRow('Categories', rowIndex, [id, newName, newDesc, createdAt]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
