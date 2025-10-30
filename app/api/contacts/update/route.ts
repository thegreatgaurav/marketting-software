import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { ensureSheetTab, getSheetData, updateSheetRow } from '@/lib/googleSheets';

async function handler(req: NextRequest) {
  try {
    const { id, name, phone, category, tags, notes } = await req.json();

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

    const current = rows[rowIndex];
    const newName = name ?? current.Name;
    const newPhone = phone ?? current.Phone;
    const newCategory = category ?? current.Category;
    const newTags = Array.isArray(tags)
      ? tags.join(',')
      : (tags ?? current.Tags);
    const newNotes = notes ?? current.Notes;

    // Preserve original CreatedAt
    const createdAt = current.CreatedAt || new Date().toISOString();

    await updateSheetRow('Contacts', rowIndex, [id, newName, newPhone, newCategory, newTags, newNotes, createdAt]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update contact' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
