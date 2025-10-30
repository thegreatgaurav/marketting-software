import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { ensureSheetTab, getSheetData, deleteSheetRow } from '@/lib/googleSheets';

async function handler(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await ensureSheetTab('Categories', ['ID', 'Name', 'Description', 'CreatedAt']);

    const rows = await getSheetData('Categories');
    const rowIndex = rows.findIndex((r: any) => r.ID === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    await deleteSheetRow('Categories', rowIndex);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
