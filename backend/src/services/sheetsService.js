import path from 'node:path';
import { google } from 'googleapis';

const headers = {
  Habitaciones: ['ID_Habitacion','Numero','Tipo','Capacidad','Precio','Estado','Piso','Observaciones'],
  Huespedes: ['ID_Huesped','Nombre','Documento','Telefono','Correo','Nacionalidad'],
  Reservas: ['ID_Reserva','ID_Huesped','ID_Habitacion','Entrada','Salida','Personas','Estado','Total','Pagado']
};

function getClient() {
  const keyFile = path.resolve(process.cwd(), process.env.GOOGLE_SERVICE_ACCOUNT_FILE || './credentials/service-account.json');
  const auth = new google.auth.GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  return google.sheets({ version: 'v4', auth });
}

export async function ensureHeaders() {
  const sheets = getClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  for (const [name, cols] of Object.entries(headers)) {
    const result = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${name}!A1:Z1` }).catch(() => ({ data: {} }));
    if (!result.data.values?.length) {
      await sheets.spreadsheets.values.update({ spreadsheetId, range: `${name}!A1`, valueInputOption: 'RAW', requestBody: { values: [cols] } });
    }
  }
}

export async function readRows(sheetName) {
  const sheets = getClient();
  const result = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID, range: `${sheetName}!A2:Z` });
  return result.data.values || [];
}

export async function appendRow(sheetName, values) {
  const sheets = getClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A:Z`, valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] }
  });
}
