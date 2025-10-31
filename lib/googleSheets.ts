import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1vEh5dvyWBTRQvYKP8eT3ozBaX6V89L0DQ0JXr3nOM4c';
const USE_LOCAL = !process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const TMP_BASE = process.env.TMPDIR || '/tmp';
const ENV_DATA_DIR = process.env.DATA_DIR;
const DATA_BASE_DIR = ENV_DATA_DIR
  ? (path.isAbsolute(ENV_DATA_DIR) ? ENV_DATA_DIR : path.join(TMP_BASE, ENV_DATA_DIR))
  : TMP_BASE;
const SHEETS_DIR = path.join(DATA_BASE_DIR, 'sheets');

async function ensureLocalDir() {
  await fs.mkdir(SHEETS_DIR, { recursive: true });
}

function getLocalSheetPath(tabName: string) {
  return path.join(SHEETS_DIR, `${tabName}.json`);
}

async function readLocalRows(tabName: string): Promise<any[][]> {
  await ensureLocalDir();
  const filePath = getLocalSheetPath(tabName);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLocalRows(tabName: string, rows: any[][]): Promise<void> {
  await ensureLocalDir();
  const filePath = getLocalSheetPath(tabName);
  await fs.writeFile(filePath, JSON.stringify(rows, null, 2), 'utf-8');
}

function getAuthClient() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  const credentials = JSON.parse(serviceAccountKey);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
  });

  return auth;
}

export async function ensureSheetTab(tabName: string, headers: string[]) {
  if (USE_LOCAL) {
    const rows = await readLocalRows(tabName);
    if (rows.length === 0) {
      await writeLocalRows(tabName, [headers]);
    } else if (rows[0].length === 0) {
      rows[0] = headers;
      await writeLocalRows(tabName, rows);
    }
    return;
  }

  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Get spreadsheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    // Check if tab exists
    const existingTab = spreadsheet.data.sheets?.find(
      (sheet) => sheet.properties?.title === tabName
    );

    if (!existingTab) {
      // Create new sheet tab
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: tabName,
                },
              },
            },
          ],
        },
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${tabName}!A1:${String.fromCharCode(64 + headers.length)}1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
    } else {
      // Check if headers exist
      const headerRange = `${tabName}!A1:${String.fromCharCode(64 + headers.length)}1`;
      const existingHeaders = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: headerRange,
      });

      if (!existingHeaders.data.values || existingHeaders.data.values.length === 0) {
        // Add headers if missing
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: headerRange,
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers],
          },
        });
      }
    }
  } catch (error) {
    console.error('Error ensuring sheet tab:', error);
    throw error;
  }
}

export async function appendToSheet(tabName: string, values: any[]) {
  if (USE_LOCAL) {
    const rows = await readLocalRows(tabName);
    if (rows.length === 0) {
      // If headers were not ensured, create empty header row to avoid shift errors
      await writeLocalRows(tabName, [[], values]);
    } else {
      rows.push(values);
      await writeLocalRows(tabName, rows);
    }
    return;
  }

  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A:Z`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [values],
    },
  });
}

export async function getSheetData(tabName: string) {
  if (USE_LOCAL) {
    const rows = await readLocalRows(tabName);
    if (rows.length === 0) return [];
    const headers = rows[0];
    return rows.slice(1).map((row) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  }

  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A:Z`,
  });

  const rows = response.data.values || [];
  if (rows.length === 0) return [];

  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: any = {};
    headers.forEach((header: string, index: number) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

export async function updateSheetRow(tabName: string, rowIndex: number, values: any[]) {
  if (USE_LOCAL) {
    const rows = await readLocalRows(tabName);
    if (rows.length < rowIndex + 2) return; // out of range, ignore
    rows[rowIndex + 1] = values;
    await writeLocalRows(tabName, rows);
    return;
  }

  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A${rowIndex + 2}:Z${rowIndex + 2}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [values],
    },
  });
}

export async function deleteSheetRow(tabName: string, rowIndex: number) {
  if (USE_LOCAL) {
    const rows = await readLocalRows(tabName);
    if (rows.length < rowIndex + 2) return; // out of range, ignore
    rows.splice(rowIndex + 1, 1);
    await writeLocalRows(tabName, rows);
    return;
  }

  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: await getSheetId(tabName),
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2,
            },
          },
        },
      ],
    },
  });
}

async function getSheetId(tabName: string): Promise<number> {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === tabName
  );

  if (!sheet?.properties?.sheetId) {
    throw new Error(`Sheet tab "${tabName}" not found`);
  }

  return sheet.properties.sheetId;
}
