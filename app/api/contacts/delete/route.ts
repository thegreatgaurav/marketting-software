import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { ensureSheetTab, getSheetData, deleteSheetRow } from '@/lib/googleSheets';

async function handler(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await ensureSheetTab('Contacts', ['ID', 'Name', 'Phone', 'Category', 'Tags', 'Notes', 'CreatedAt']);

    const rows = await getSheetData('Contacts');
    const rowIndex = rows.findIndex((r: any) => r.ID === id);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    await deleteSheetRow('Contacts', rowIndex);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete contact' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
