import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { ensureSheetTab, getSheetData, deleteSheetRow } from '@/lib/googleSheets';

async function handler(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await ensureSheetTab('Templates', ['ID', 'Name', 'Content', 'Type', 'CreatedAt']);

    const rows = await getSheetData('Templates');
    const rowIndex = rows.findIndex((r: any) => r.ID === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await deleteSheetRow('Templates', rowIndex);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
