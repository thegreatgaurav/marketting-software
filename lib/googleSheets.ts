import { google } from 'googleapis';

const SPREADSHEET_ID = '1vEh5dvyWBTRQvYKP8eT3ozBaX6V89L0DQ0JXr3nOM4c';

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
