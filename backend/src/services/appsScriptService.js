const baseUrl = () => process.env.APPS_SCRIPT_URL;
const token = () => process.env.APPS_SCRIPT_TOKEN;

function assertConfig() {
  if (!baseUrl()) throw new Error('Falta APPS_SCRIPT_URL en backend/.env');
  if (!token()) throw new Error('Falta APPS_SCRIPT_TOKEN en backend/.env');
}

async function parseResponse(response) {
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Respuesta inválida de Apps Script: ${text.slice(0, 180)}`); }
  if (!response.ok || data.ok === false) throw new Error(data.mensaje || `Error HTTP ${response.status}`);
  return data;
}

export async function appScriptGet(action) {
  assertConfig();
  const url = new URL(baseUrl());
  url.searchParams.set('accion', action);
  url.searchParams.set('token', token());
  const response = await fetch(url, { redirect: 'follow' });
  const data = await parseResponse(response);
  return data.datos || [];
}

export async function appScriptPost(action, datos) {
  assertConfig();
  const response = await fetch(baseUrl(), {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ accion: action, token: token(), datos })
  });
  const data = await parseResponse(response);
  return data.datos;
}
