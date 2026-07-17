# HotelControl 3.0

Sistema web instalable y adaptable para administrar uno o varios hospedajes desde celular y computadora.

## Funciones principales

- Login seguro, usuarios y roles.
- Calendario mensual de disponibilidad.
- Reservas futuras e ingreso inmediato.
- Check-in, cobros parciales, edición de estadía y check-out.
- Historial de estadías finalizadas.
- Exportación compatible con Excel e impresión/PDF.
- Configuración de hospedajes y habitaciones.
- Google Sheets como almacenamiento mediante Apps Script.

## Estructura

- `frontend`: React + Vite.
- `backend`: Node.js + Express.
- `google-apps-script`: API para Google Sheets.

## Google Apps Script

1. Abra el archivo Google Sheets.
2. Entre a **Extensiones > Apps Script**.
3. Reemplace el contenido con `google-apps-script/Codigo.gs`.
4. Cambie `CAMBIAR_TOKEN_LARGO` por un token privado.
5. Ejecute manualmente `setupHojas`.
6. Publique como aplicación web: ejecutar como usted y acceso para cualquier persona.

`setupHojas` crea o actualiza las hojas: Usuarios, Hospedajes, Habitaciones, Huespedes, Reservas, Pagos, Limpieza, Mantenimiento, Auditoria y Configuracion.

## Backend local

Copie `.env.example` a `.env` y configure:

```env
PORT=4000
DATA_MODE=apps-script
APPS_SCRIPT_URL=https://script.google.com/macros/s/ID/exec
APPS_SCRIPT_TOKEN=EL_MISMO_TOKEN_DEL_SCRIPT
JWT_SECRET=CLAVE_PRIVADA_LARGA
JWT_EXPIRES_IN=8h
SETUP_KEY=CLAVE_DE_INSTALACION
FRONTEND_URL=http://localhost:5173,https://SU-PROYECTO.vercel.app
```

Instalación:

```bash
cd backend
yarn install --registry https://registry.npmjs.org
yarn start
```

## Frontend local

Copie `.env.example` a `.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

```bash
cd frontend
npm install
npm run dev
```

## Render

- Root Directory: `backend`
- Build Command: `yarn config set registry https://registry.npmjs.org && yarn install --frozen-lockfile --network-timeout 600000`
- Start Command: `yarn start`

Agregue las variables del backend en **Environment**.

## Vercel

- Root Directory: `frontend`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Variable: `VITE_API_URL=https://SU-BACKEND.onrender.com/api`

Después de cambiar una variable `VITE_`, haga un nuevo despliegue sin caché.
