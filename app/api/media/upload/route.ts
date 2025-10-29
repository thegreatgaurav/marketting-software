import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { uploadFileToDrive } from '@/lib/googleDrive';
import { appendToSheet, ensureSheetTab } from '@/lib/googleSheets';

async function handler(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Google Drive
    const driveFile = await uploadFileToDrive(
      buffer,
      file.name,
      file.type
    );

    // Ensure Media sheet exists
    await ensureSheetTab('Media', ['Name', 'File ID', 'URL', 'Size', 'Type', 'Upload Date']);

    // Log to sheet
    const date = new Date().toISOString();
    await appendToSheet('Media', [
      file.name,
      driveFile.id,
      driveFile.url || '',
      driveFile.size || '0',
      file.type,
      date,
    ]);

    return NextResponse.json({
      success: true,
      file: {
        id: driveFile.id,
        name: driveFile.name,
        url: driveFile.url,
        size: driveFile.size,
        createdTime: driveFile.createdTime,
      },
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
