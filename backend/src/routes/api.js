import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../data/mockData.js';
import { appendRow, readRows } from '../services/sheetsService.js';
import { appScriptGet, appScriptPost } from '../services/appsScriptService.js';

const router = Router();
const useSheets = () => process.env.DATA_MODE === 'sheets';
const useAppsScript = () => process.env.DATA_MODE === 'apps-script';
const useRemote = () => useSheets() || useAppsScript();
const id = prefix => `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;

router.get('/health', (_req, res) => res.json({ ok: true, mode: process.env.DATA_MODE || 'mock' }));

router.get('/dashboard', async (_req, res, next) => {
  try {
    let habitaciones, reservas;
    if (useAppsScript()) {
      habitaciones = (await appScriptGet('habitaciones')).map(r => ({ estado: r.Estado, precio: Number(r.Precio || 0) }));
      reservas = (await appScriptGet('reservas')).map(r => ({ estado: r.Estado, total: Number(r.Total || 0), pagado: Number(r.Adelanto || 0), entrada: r.Fecha_Entrada, salida: r.Fecha_Salida }));
    } else if (useSheets()) {
      habitaciones = (await readRows('Habitaciones')).map(r => ({ estado: r[5], precio: Number(r[4] || 0) }));
      reservas = (await readRows('Reservas')).map(r => ({ estado: r[6], total: Number(r[7] || 0), pagado: Number(r[8] || 0), entrada: r[3], salida: r[4] }));
    } else ({ habitaciones, reservas } = db);
    const count = estado => habitaciones.filter(h => h.estado === estado).length;
    res.json({
      habitaciones: habitaciones.length,
      disponibles: count('Disponible'), ocupadas: count('Ocupada'), limpieza: count('Limpieza'), mantenimiento: count('Mantenimiento'),
      reservasActivas: reservas.filter(r => ['Confirmada','En curso'].includes(r.estado)).length,
      ingresos: reservas.reduce((s,r) => s + Number(r.pagado || 0), 0),
      pendiente: reservas.reduce((s,r) => s + Math.max(0, Number(r.total||0)-Number(r.pagado||0)), 0)
    });
  } catch (e) { next(e); }
});

router.get('/habitaciones', async (_req,res,next) => {
  try {
    if (useAppsScript()) { const rows=await appScriptGet('habitaciones'); return res.json(rows.map(r=>({id:r.ID_Habitacion,numero:r.Numero,tipo:r.Tipo,capacidad:Number(r.Capacidad),precio:Number(r.Precio),estado:r.Estado,piso:Number(r.Piso),observaciones:r.Observaciones||''}))); }
    if (!useSheets()) return res.json(db.habitaciones);
    const rows = await readRows('Habitaciones');
    res.json(rows.map(r => ({ id:r[0], numero:r[1], tipo:r[2], capacidad:Number(r[3]), precio:Number(r[4]), estado:r[5], piso:Number(r[6]), observaciones:r[7]||'' })));
  } catch(e){next(e)}
});
router.post('/habitaciones', async (req,res,next) => {
  try {
    const h={ id:id('HAB'), ...req.body, capacidad:Number(req.body.capacidad), precio:Number(req.body.precio), piso:Number(req.body.piso)};
    if(useAppsScript()) { const creado=await appScriptPost('crearHabitacion',{Numero:h.numero,Tipo:h.tipo,Capacidad:h.capacidad,Precio:h.precio,Estado:h.estado,Piso:h.piso,Observaciones:h.observaciones||''}); return res.status(201).json({id:creado.ID_Habitacion,numero:creado.Numero,tipo:creado.Tipo,capacidad:Number(creado.Capacidad),precio:Number(creado.Precio),estado:creado.Estado,piso:Number(creado.Piso),observaciones:creado.Observaciones||''}); }
    if(useSheets()) await appendRow('Habitaciones',[h.id,h.numero,h.tipo,h.capacidad,h.precio,h.estado,h.piso,h.observaciones||'']); else db.habitaciones.push(h);
    res.status(201).json(h);
  } catch(e){next(e)}
});

router.get('/huespedes', async (_req,res,next)=>{
  try { if(useAppsScript()){const rows=await appScriptGet('huespedes'); return res.json(rows.map(r=>({id:r.ID_Huesped,nombre:[r.Nombres,r.Apellidos].filter(Boolean).join(' '),documento:r.Documento,telefono:r.Telefono,correo:r.Correo,nacionalidad:r.Nacionalidad})));} if(!useSheets()) return res.json(db.huespedes); const rows=await readRows('Huespedes'); res.json(rows.map(r=>({id:r[0],nombre:r[1],documento:r[2],telefono:r[3],correo:r[4],nacionalidad:r[5]}))); } catch(e){next(e)}
});
router.post('/huespedes', async(req,res,next)=>{
  try { const h={id:id('HUE'),...req.body}; if(useAppsScript()){const partes=String(h.nombre||'').trim().split(/\s+/); const creado=await appScriptPost('crearHuesped',{Nombres:partes.shift()||'',Apellidos:partes.join(' '),Documento:h.documento,Telefono:h.telefono,Correo:h.correo,Nacionalidad:h.nacionalidad}); return res.status(201).json({id:creado.ID_Huesped,nombre:[creado.Nombres,creado.Apellidos].filter(Boolean).join(' '),documento:creado.Documento,telefono:creado.Telefono,correo:creado.Correo,nacionalidad:creado.Nacionalidad});} if(useSheets()) await appendRow('Huespedes',[h.id,h.nombre,h.documento,h.telefono,h.correo,h.nacionalidad]); else db.huespedes.push(h); res.status(201).json(h);} catch(e){next(e)}
});

router.get('/reservas', async(_req,res,next)=>{
  try { if(useAppsScript()){const rows=await appScriptGet('reservas'); return res.json(rows.map(r=>({id:r.ID_Reserva,huespedId:r.ID_Huesped,habitacionId:r.ID_Habitacion,entrada:r.Fecha_Entrada,salida:r.Fecha_Salida,personas:Number(r.Cantidad_Personas),estado:r.Estado,total:Number(r.Total),pagado:Number(r.Adelanto||0)})));} if(!useSheets()) return res.json(db.reservas); const rows=await readRows('Reservas'); res.json(rows.map(r=>({id:r[0],huespedId:r[1],habitacionId:r[2],entrada:r[3],salida:r[4],personas:Number(r[5]),estado:r[6],total:Number(r[7]),pagado:Number(r[8])}))); } catch(e){next(e)}
});
router.post('/reservas', async(req,res,next)=>{
  try {
    const r={id:id('RES'),...req.body,personas:Number(req.body.personas),total:Number(req.body.total),pagado:Number(req.body.pagado||0)};
    let existentes = useAppsScript() ? (await appScriptGet('reservas')).map(x=>({habitacionId:x.ID_Habitacion,entrada:x.Fecha_Entrada,salida:x.Fecha_Salida,estado:x.Estado})) : useSheets() ? (await readRows('Reservas')).map(x=>({habitacionId:x[2],entrada:x[3],salida:x[4],estado:x[6]})) : db.reservas;
    const choque=existentes.some(x=>x.habitacionId===r.habitacionId && x.estado!=='Cancelada' && r.entrada < x.salida && r.salida > x.entrada);
    if(choque) return res.status(409).json({mensaje:'La habitación ya está reservada en ese rango de fechas.'});
    if(useAppsScript()){const precioNoche=Number(r.total||0)/Math.max(1,Math.ceil((new Date(r.salida)-new Date(r.entrada))/86400000)); const creado=await appScriptPost('crearReserva',{ID_Huesped:r.huespedId,ID_Habitacion:r.habitacionId,Fecha_Entrada:r.entrada,Fecha_Salida:r.salida,Cantidad_Personas:r.personas,Precio_Noche:precioNoche,Adelanto:r.pagado,Estado:r.estado}); return res.status(201).json({id:creado.ID_Reserva,huespedId:creado.ID_Huesped,habitacionId:creado.ID_Habitacion,entrada:creado.Fecha_Entrada,salida:creado.Fecha_Salida,personas:Number(creado.Cantidad_Personas),estado:creado.Estado,total:Number(creado.Total),pagado:Number(creado.Adelanto||0)});}
    if(useSheets()) await appendRow('Reservas',[r.id,r.huespedId,r.habitacionId,r.entrada,r.salida,r.personas,r.estado,r.total,r.pagado]); else db.reservas.push(r);
    res.status(201).json(r);
  } catch(e){next(e)}
});

export default router;
