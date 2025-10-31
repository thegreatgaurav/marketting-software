import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || '1o9678grxPaJDHPsB3qPirt0YtSoOkQLP';
const USE_LOCAL = !process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const TMP_BASE = process.env.TMPDIR || '/tmp';
const ENV_DATA_DIR = process.env.DATA_DIR;
const DATA_BASE_DIR = ENV_DATA_DIR
  ? (path.isAbsolute(ENV_DATA_DIR) ? ENV_DATA_DIR : path.join(TMP_BASE, ENV_DATA_DIR))
  : TMP_BASE;
const MEDIA_DIR = path.join(DATA_BASE_DIR, 'media');
const MEDIA_INDEX = path.join(MEDIA_DIR, 'index.json');

async function ensureLocalDir() {
  await fs.mkdir(MEDIA_DIR, { recursive: true });
  try {
    await fs.access(MEDIA_INDEX);
  } catch {
    await fs.writeFile(MEDIA_INDEX, JSON.stringify({}, null, 2), 'utf-8');
  }
}

async function readIndex(): Promise<Record<string, any>> {
  await ensureLocalDir();
  const raw = await fs.readFile(MEDIA_INDEX, 'utf-8');
  return JSON.parse(raw);
}

async function writeIndex(index: Record<string, any>): Promise<void> {
  await ensureLocalDir();
  await fs.writeFile(MEDIA_INDEX, JSON.stringify(index, null, 2), 'utf-8');
}

function getAuthClient() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  const credentials = JSON.parse(serviceAccountKey);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return auth;
}

export async function uploadFileToDrive(fileBuffer: Buffer, fileName: string, mimeType: string) {
  if (USE_LOCAL) {
    await ensureLocalDir();
    const id = crypto.randomUUID();
    const filePath = path.join(MEDIA_DIR, `${id}-${fileName}`);
    await fs.writeFile(filePath, fileBuffer);
    const stats = await fs.stat(filePath);
    const createdTime = new Date(stats.birthtimeMs || Date.now()).toISOString();
    const size = String(stats.size);

    const index = await readIndex();
    index[id] = {
      id,
      name: fileName,
      webViewLink: '',
      createdTime,
      size,
      mimeType,
      path: filePath,
    };
    await writeIndex(index);

    return { id, name: fileName, url: '', createdTime, size };
  }

  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: fileName,
    parents: [DRIVE_FOLDER_ID] as string[],
  };

  const media = {
    mimeType: mimeType,
    body: fileBuffer as any, // googleapis accepts stream or buffer
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, createdTime, size',
  });

  return {
    id: response.data.id,
    name: response.data.name,
    url: response.data.webViewLink,
    createdTime: response.data.createdTime,
    size: response.data.size,
  };
}

export async function listDriveFiles() {
  if (USE_LOCAL) {
    const index = await readIndex();
    const files = Object.values(index) as any[];
    // Sort by createdTime desc
    files.sort((a, b) => (b.createdTime || '').localeCompare(a.createdTime || ''));
    return files.map((f) => ({
      id: f.id,
      name: f.name,
      webViewLink: f.webViewLink || '',
      createdTime: f.createdTime,
      size: f.size,
      mimeType: f.mimeType,
    }));
  }

  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.list({
    q: `'${DRIVE_FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id, name, webViewLink, createdTime, size, mimeType)',
    orderBy: 'createdTime desc',
  });

  return response.data.files || [];
}

export async function deleteDriveFile(fileId: string) {
  if (USE_LOCAL) {
    const index = await readIndex();
    const entry = index[fileId];
    if (entry?.path) {
      try {
        await fs.unlink(entry.path);
      } catch {}
    }
    delete index[fileId];
    await writeIndex(index);
    return;
  }

  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  await drive.files.delete({
    fileId: fileId,
  });
}
