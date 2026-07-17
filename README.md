# HotelControl Profesional

Sistema web profesional para la administración de un hotel, con:

- Frontend React + Vite.
- Backend Node.js + Express.
- Google Sheets como almacenamiento.
- Google Apps Script como API de datos.
- Inicio de sesión con JWT.
- Contraseñas protegidas con bcrypt.
- Roles: Administrador, Recepcionista, Gerencia, Limpieza y Mantenimiento.
- Dashboard, habitaciones, huéspedes, reservas, pagos y usuarios.
- Diseño adaptable para computadora y celular.

## 1. Contenido del proyecto

```text
sistema-hotel-profesional/
├── backend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── yarn.lock
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── google-apps-script/
│   └── Codigo.gs
├── render.yaml
├── .gitignore
└── README.md
```

## 2. Configurar Google Sheets

1. Cree un archivo de Google Sheets.
2. Abra `Extensiones > Apps Script`.
3. Copie todo el contenido de `google-apps-script/Codigo.gs`.
4. Cambie en la primera línea:

```javascript
const TOKEN_SECRETO = 'CAMBIAR_TOKEN_LARGO';
```

por una clave privada larga.
5. Guarde el proyecto.
6. Ejecute manualmente la función `setupHojas` una sola vez y autorice el acceso.
7. Publique como aplicación web:
   - Ejecutar como: Yo.
   - Quién tiene acceso: Cualquier persona.
8. Copie la URL terminada en `/exec`.

## 3. Configurar el backend local

Copie:

```text
backend/.env.example
```

como:

```text
backend/.env
```

Complete:

```env
PORT=4000
DATA_MODE=apps-script
APPS_SCRIPT_URL=https://script.google.com/macros/s/IDENTIFICADOR/exec
APPS_SCRIPT_TOKEN=EL_MISMO_TOKEN_DEL_CODIGO_GS
JWT_SECRET=UNA_CLAVE_JWT_MUY_LARGA
JWT_EXPIRES_IN=8h
SETUP_KEY=CLAVE_PRIVADA_PARA_CREAR_EL_PRIMER_ADMIN
FRONTEND_URL=http://localhost:5173
```

Instale y ejecute:

```bash
cd backend
yarn install --frozen-lockfile
yarn start
```

También puede usar:

```bash
npm install
npm start
```

Prueba:

```text
http://localhost:4000/api/health
```

## 4. Configurar el frontend local

Copie:

```text
frontend/.env.example
```

como:

```text
frontend/.env
```

Contenido:

```env
VITE_API_URL=http://localhost:4000/api
```

Ejecute:

```bash
cd frontend
npm install
npm run dev
```

Abra:

```text
http://localhost:5173
```

## 5. Crear el primer administrador

Cuando la hoja `Usuarios` esté vacía, la pantalla mostrará la configuración inicial.
Use la misma `SETUP_KEY` configurada en el backend y defina:

- Nombre del administrador.
- Correo.
- Contraseña de al menos 8 caracteres.

La contraseña se guarda como hash bcrypt, nunca como texto normal.

## 6. Publicar el backend en Render

Configuración:

```text
Root Directory: backend
Build Command: yarn install --frozen-lockfile
Start Command: yarn start
```

Variables de entorno:

```env
DATA_MODE=apps-script
APPS_SCRIPT_URL=URL_DE_APPS_SCRIPT
APPS_SCRIPT_TOKEN=TOKEN_DEL_CODIGO_GS
JWT_SECRET=CLAVE_JWT_LARGA
JWT_EXPIRES_IN=8h
SETUP_KEY=CLAVE_DE_INSTALACION
FRONTEND_URL=https://SU_FRONTEND.vercel.app
```

No es necesario configurar `PORT`; Render lo asigna.

## 7. Publicar el frontend en Vercel

Configuración:

```text
Root Directory: frontend
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Variable:

```env
VITE_API_URL=https://SU_BACKEND.onrender.com/api
```

Después de cambiar una variable en Vercel, realice un nuevo despliegue.

## 8. Seguridad

- No suba `backend/.env` ni `frontend/.env` a GitHub.
- No publique `APPS_SCRIPT_TOKEN`, `JWT_SECRET` ni `SETUP_KEY`.
- Cambie las claves de ejemplo antes de usar el sistema.
- Use contraseñas distintas para cada usuario.
- El plan gratuito de Render puede tardar en despertar luego de un periodo sin uso.

## 9. Actualizar Apps Script

Cada vez que modifique `Codigo.gs`:

```text
Implementar > Administrar implementaciones > Editar > Nueva versión > Implementar
```

Conserve la misma implementación para mantener la misma URL.
