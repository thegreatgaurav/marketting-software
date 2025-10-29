import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { deleteDriveFile } from '@/lib/googleDrive';

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    await deleteDriveFile(fileId);

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
