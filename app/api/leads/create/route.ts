import { NextRequest, NextResponse } from 'next/server';
import { ensureSheetTab, appendToSheet } from '@/lib/googleSheets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Ensure the Leads sheet exists with headers
    await ensureSheetTab('Leads', ['Name', 'Email', 'Phone', 'Message', 'Date', 'Status']);

    // Append the new lead
    const date = new Date().toISOString();
    await appendToSheet('Leads', [name, email, phone, message, date, 'New']);

    return NextResponse.json({ success: true, message: 'Lead created successfully' });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create lead' },
      { status: 500 }
    );
  }
}
