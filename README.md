# Sistema web de administración hotelera

Primera versión funcional creada con React + Vite, Node.js + Express y conexión opcional a Google Sheets.

## Funciona inmediatamente
Por defecto usa datos de demostración en memoria (`DATA_MODE=mock`). Permite:
- Dashboard hotelero.
- Listado y registro de habitaciones.
- Listado y registro de huéspedes.
- Listado y registro de reservas.
- Validación de cruce de reservas.
- Resumen de pagos.
- Diseño adaptable a computadora y celular.

## Requisitos
- Node.js 20.19+ o 22.12+.
- Visual Studio Code.

## Instalación rápida en Windows
1. Copie `backend/.env.example` como `backend/.env`.
2. Abra la carpeta completa en Visual Studio Code.
3. En una terminal:

```bash
cd backend
npm install
npm run dev
```

4. Abra otra terminal:

```bash
cd frontend
npm install
npm run dev
```

5. Abra `http://localhost:5173`.

## Conectar Google Sheets
1. Cree un Google Sheets con las pestañas: `Habitaciones`, `Huespedes` y `Reservas`.
2. Copie en la fila 1 los encabezados indicados en `PLANTILLA_GOOGLE_SHEETS.csv.txt`.
3. En Google Cloud habilite Google Sheets API y cree una cuenta de servicio.
4. Descargue su JSON como `backend/credentials/service-account.json`.
5. Comparta el Google Sheets con el correo de la cuenta de servicio como editor.
6. Copie `backend/.env.example` a `backend/.env` y configure:

```env
PORT=4000
DATA_MODE=sheets
GOOGLE_SHEET_ID=ID_DEL_ARCHIVO
GOOGLE_SERVICE_ACCOUNT_FILE=./credentials/service-account.json
```

El ID es el texto entre `/d/` y `/edit` en la dirección del Google Sheets.

## Importante
No suba el archivo `service-account.json` a GitHub ni lo comparta públicamente. Esta entrega es una base funcional; autenticación, auditoría, edición, check-in/check-out, limpieza, mantenimiento, facturación y despliegue deben añadirse para uso productivo.
