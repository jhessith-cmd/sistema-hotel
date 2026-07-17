import { Router } from 'express';
import { appScriptGet, appScriptPost } from '../services/appsScriptService.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
const writeHotel = allowRoles('Administrador', 'Recepcionista');

router.get('/dashboard', async (_req, res, next) => {
  try {
    const [habitaciones, reservas] = await Promise.all([appScriptGet('habitaciones'), appScriptGet('reservas')]);
    const count = estado => habitaciones.filter(h => h.Estado === estado).length;
    res.json({
      habitaciones: habitaciones.length,
      disponibles: count('Disponible'),
      ocupadas: count('Ocupada'),
      limpieza: count('Limpieza') + count('En limpieza'),
      mantenimiento: count('Mantenimiento'),
      reservasActivas: reservas.filter(r => ['Confirmada', 'En curso'].includes(r.Estado)).length,
      ingresos: reservas.reduce((s, r) => s + Number(r.Adelanto || 0), 0),
      pendiente: reservas.reduce((s, r) => s + Math.max(0, Number(r.Total || 0) - Number(r.Adelanto || 0)), 0)
    });
  } catch (e) { next(e); }
});

router.get('/habitaciones', async (_req, res, next) => {
  try {
    const rows = await appScriptGet('habitaciones');
    res.json(rows.map(r => ({ id:r.ID_Habitacion, numero:r.Numero, tipo:r.Tipo, capacidad:Number(r.Capacidad), precio:Number(r.Precio), estado:r.Estado, piso:Number(r.Piso), observaciones:r.Observaciones || '' })));
  } catch (e) { next(e); }
});
router.post('/habitaciones', writeHotel, async (req, res, next) => {
  try {
    const h = req.body;
    const r = await appScriptPost('crearHabitacion', { Numero:h.numero, Tipo:h.tipo, Capacidad:Number(h.capacidad), Precio:Number(h.precio), Estado:h.estado || 'Disponible', Piso:Number(h.piso), Observaciones:h.observaciones || '' });
    res.status(201).json(r);
  } catch (e) { next(e); }
});

router.get('/huespedes', async (_req, res, next) => {
  try {
    const rows = await appScriptGet('huespedes');
    res.json(rows.map(r => ({ id:r.ID_Huesped, nombre:[r.Nombres,r.Apellidos].filter(Boolean).join(' '), documento:r.Documento, telefono:r.Telefono, correo:r.Correo, nacionalidad:r.Nacionalidad })));
  } catch (e) { next(e); }
});
router.post('/huespedes', writeHotel, async (req, res, next) => {
  try {
    const p = String(req.body.nombre || '').trim().split(/\s+/);
    const r = await appScriptPost('crearHuesped', { Nombres:p.shift() || '', Apellidos:p.join(' '), Documento:req.body.documento, Telefono:req.body.telefono, Correo:req.body.correo, Nacionalidad:req.body.nacionalidad });
    res.status(201).json(r);
  } catch (e) { next(e); }
});

router.get('/reservas', async (_req, res, next) => {
  try {
    const rows = await appScriptGet('reservas');
    res.json(rows.map(r => ({ id:r.ID_Reserva, huespedId:r.ID_Huesped, habitacionId:r.ID_Habitacion, entrada:r.Fecha_Entrada, salida:r.Fecha_Salida, personas:Number(r.Cantidad_Personas), estado:r.Estado, total:Number(r.Total), pagado:Number(r.Adelanto || 0) })));
  } catch (e) { next(e); }
});
router.post('/reservas', writeHotel, async (req, res, next) => {
  try {
    const r = req.body;
    const nights = Math.max(1, Math.ceil((new Date(r.salida) - new Date(r.entrada)) / 86400000));
    const precioNoche = Number(r.total || 0) / nights;
    const created = await appScriptPost('crearReserva', { ID_Huesped:r.huespedId, ID_Habitacion:r.habitacionId, Fecha_Entrada:r.entrada, Fecha_Salida:r.salida, Cantidad_Personas:Number(r.personas), Precio_Noche:precioNoche, Adelanto:Number(r.pagado || 0), Estado:r.estado || 'Confirmada', Usuario_Registro:req.user.sub });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

router.get('/pagos', async (_req, res, next) => {
  try { res.json(await appScriptGet('pagos')); } catch (e) { next(e); }
});
router.post('/pagos', writeHotel, async (req, res, next) => {
  try { res.status(201).json(await appScriptPost('crearPago', { ...req.body, Usuario_Registro:req.user.sub })); } catch (e) { next(e); }
});

export default router;
