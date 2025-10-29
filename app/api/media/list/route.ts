import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { listDriveFiles } from '@/lib/googleDrive';

async function handler(req: NextRequest) {
  try {
    const files = await listDriveFiles();
    
    return NextResponse.json({ files });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
