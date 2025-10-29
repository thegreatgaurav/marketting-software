import { google } from 'googleapis';

const DRIVE_FOLDER_ID = '1o9678grxPaJDHPsB3qPirt0YtSoOkQLP';

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
  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: fileName,
    parents: [DRIVE_FOLDER_ID],
  };

  const media = {
    mimeType: mimeType,
    body: fileBuffer,
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
  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  await drive.files.delete({
    fileId: fileId,
  });
}
