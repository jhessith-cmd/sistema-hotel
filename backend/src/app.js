import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import auth from './routes/auth.js';
import api from './routes/api.js';

if (!process.env.JWT_SECRET) {
  throw new Error('Falta la variable JWT_SECRET');
}

const app = express();
const normalizeOrigin = (value = '') => value.trim().replace(/\/$/, '');
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  ...configuredOrigins,
]);

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = normalizeOrigin(origin);
      const isAllowed =
        allowedOrigins.has(normalized) ||
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalized);

      if (isAllowed) return callback(null, true);
      console.error('Origen rechazado por CORS:', normalized);
      return callback(new Error('Origen no autorizado'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.options(/.*/, cors());
app.use(express.json({ limit: '1mb' }));
app.use(
  '/api/auth/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { mensaje: 'Demasiados intentos. Intente nuevamente más tarde.' },
  })
);

app.get('/', (_req, res) =>
  res.json({ sistema: 'HotelControl', estado: 'activo', version: '2.1.0' })
);
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, mode: process.env.DATA_MODE || 'apps-script' })
);
app.use('/api/auth', auth);
app.use('/api', api);
app.use((_req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.message === 'Origen no autorizado' ? 403 : 500;
  res.status(status).json({ mensaje: err.message || 'Error interno' });
});

const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', () =>
  console.log(`HotelControl API activa en puerto ${port}`)
);
