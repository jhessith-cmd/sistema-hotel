import { Router } from 'express';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { appScriptGet, appScriptPost } from '../services/appsScriptService.js';

const router = Router();
router.use(requireAuth);
const writeHotel = allowRoles('Administrador','Recepcionista');
const adminOnly = allowRoles('Administrador');
const n = v => Number(v || 0);

router.get('/dashboard', async (_req,res,next)=>{
  try{
    const [rooms,reservas,pagos,hospedajes] = await Promise.all([
      appScriptGet('habitaciones'), appScriptGet('reservas'), appScriptGet('pagos'), appScriptGet('hospedajes')
    ]);
    const active = reservas.filter(r=>!['Cancelada','Finalizada'].includes(r.Estado));
    res.json({
      hospedajes:hospedajes.filter(x=>x.Estado!=='Inactivo').length,
      habitaciones:rooms.filter(x=>x.Activo!=='No').length,
      disponibles:rooms.filter(x=>x.Estado==='Disponible').length,
      ocupadas:rooms.filter(x=>x.Estado==='Ocupada').length,
      reservadas:rooms.filter(x=>x.Estado==='Reservada').length,
      reservasActivas:active.length,
      ingresos:pagos.filter(p=>p.Estado!=='Anulado').reduce((s,p)=>s+n(p.Monto),0),
      pendiente:reservas.filter(r=>!['Cancelada','Finalizada'].includes(r.Estado)).reduce((s,r)=>s+n(r.Saldo),0)
    });
  }catch(e){next(e)}
});

router.get('/hospedajes', async (_req,res,next)=>{try{res.json((await appScriptGet('hospedajes')).map(x=>({id:x.ID_Hospedaje,nombre:x.Nombre,direccion:x.Direccion,estado:x.Estado||'Activo'})))}catch(e){next(e)}});
router.post('/hospedajes', adminOnly, async(req,res,next)=>{try{res.status(201).json(await appScriptPost('crearHospedaje',{Nombre:req.body.nombre,Direccion:req.body.direccion||'',Estado:req.body.estado||'Activo'}))}catch(e){next(e)}});
router.patch('/hospedajes/:id', adminOnly, async(req,res,next)=>{try{res.json(await appScriptPost('actualizarHospedaje',{ID_Hospedaje:req.params.id,Nombre:req.body.nombre,Direccion:req.body.direccion||'',Estado:req.body.estado||'Activo'}))}catch(e){next(e)}});

router.get('/habitaciones', async (_req,res,next)=>{try{res.json((await appScriptGet('habitaciones')).map(r=>({id:r.ID_Habitacion,hospedajeId:r.ID_Hospedaje||'HOS-0001',numero:r.Numero||r['Número']||r.Habitacion||r['Habitación'],tipo:r.Tipo||'Estándar',capacidad:n(r.Capacidad),precio:n(r.Precio),estado:String(r.Estado||'Disponible').trim(),piso:n(r.Piso),activo:String(r.Activo||'Sí').trim(),observaciones:r.Observaciones||''})))}catch(e){next(e)}});
router.post('/habitaciones', writeHotel, async(req,res,next)=>{try{const h=req.body;res.status(201).json(await appScriptPost('crearHabitacion',{ID_Hospedaje:h.hospedajeId,Numero:h.numero,Tipo:h.tipo,Capacidad:n(h.capacidad),Precio:n(h.precio),Estado:h.estado||'Disponible',Piso:n(h.piso),Activo:h.activo||'Sí',Observaciones:h.observaciones||''}))}catch(e){next(e)}});
router.patch('/habitaciones/:id', adminOnly, async(req,res,next)=>{try{res.json(await appScriptPost('actualizarHabitacion',{ID_Habitacion:req.params.id,...req.body}))}catch(e){next(e)}});

router.get('/huespedes', async (_req,res,next)=>{try{res.json((await appScriptGet('huespedes')).map(r=>({id:r.ID_Huesped,nombre:[r.Nombres,r.Apellidos].filter(Boolean).join(' '),documento:r.Documento,telefono:r.Telefono,correo:r.Correo,nacionalidad:r.Nacionalidad})))}catch(e){next(e)}});
router.post('/huespedes', writeHotel, async(req,res,next)=>{try{const parts=String(req.body.nombre||'').trim().split(/\s+/);res.status(201).json(await appScriptPost('crearHuesped',{Nombres:parts.shift()||'',Apellidos:parts.join(' '),Documento:req.body.documento||'',Telefono:req.body.telefono||'',Correo:req.body.correo||'',Nacionalidad:req.body.nacionalidad||'Boliviana'}))}catch(e){next(e)}});

router.get('/reservas', async (_req,res,next)=>{try{res.json((await appScriptGet('reservas')).map(r=>({id:r.ID_Reserva,huespedId:r.ID_Huesped,habitacionId:r.ID_Habitacion,entrada:r.Fecha_Entrada,salida:r.Fecha_Salida,personas:n(r.Cantidad_Personas),precio:n(r.Total),pagado:n(r.Pagado||r.Adelanto),saldo:n(r.Saldo),estado:r.Estado,observaciones:r.Observaciones||'',fechaIngresoReal:r.Fecha_Ingreso_Real||'',horaIngreso:r.Hora_Ingreso||'',fechaSalidaReal:r.Fecha_Salida_Real||''})))}catch(e){next(e)}});
router.post('/reservas', writeHotel, async(req,res,next)=>{
  try{
    const b=req.body;
    let huespedId=b.huespedId;
    if(!huespedId){
      const parts=String(b.nombre||'').trim().split(/\s+/);
      const h=await appScriptPost('crearHuesped',{Nombres:parts.shift()||'',Apellidos:parts.join(' '),Documento:b.documento||'',Telefono:b.telefono||'',Correo:b.correo||'',Nacionalidad:b.nacionalidad||'Boliviana'});
      huespedId=h.ID_Huesped;
    }
    const nights=Math.max(1,Math.ceil((new Date(b.salida)-new Date(b.entrada))/86400000));
    const total=n(b.total); const precioNoche=total/nights;
    const created=await appScriptPost('crearReserva',{ID_Huesped:huespedId,ID_Habitacion:b.habitacionId,Fecha_Entrada:b.entrada,Fecha_Salida:b.salida,Cantidad_Personas:n(b.personas),Precio_Noche:precioNoche,Adelanto:n(b.pagado),Estado:b.ingresarAhora?'Ocupada':'Confirmada',Observaciones:b.observaciones||'',Usuario_Registro:req.user.sub,Ingreso_Ahora:Boolean(b.ingresarAhora)});
    res.status(201).json(created);
  }catch(e){next(e)}
});
router.post('/reservas/:id/accion', writeHotel, async(req,res,next)=>{try{res.json(await appScriptPost('accionReserva',{ID_Reserva:req.params.id,Accion:req.body.accion,Monto:n(req.body.monto),Metodo_Pago:req.body.metodoPago||'',Fecha:req.body.fecha||'',Hora:req.body.hora||'',Observaciones:req.body.observaciones||'',Fecha_Salida:req.body.salida||'',Total:req.body.total===''?undefined:n(req.body.total),ID_Habitacion:req.body.habitacionId||'',Cantidad_Personas:req.body.personas? n(req.body.personas):undefined,Usuario_Registro:req.user.sub}))}catch(e){next(e)}});


router.get('/limpieza', async (_req,res,next)=>{try{
  const [items,habitaciones,hospedajes]=await Promise.all([appScriptGet('limpieza'),appScriptGet('habitaciones'),appScriptGet('hospedajes')]);
  const roomMap=Object.fromEntries(habitaciones.map(x=>[x.ID_Habitacion,x]));
  const hotelMap=Object.fromEntries(hospedajes.map(x=>[x.ID_Hospedaje,x.Nombre]));
  res.json(items.map(x=>({id:x.ID_Limpieza,habitacionId:x.ID_Habitacion,habitacion:roomMap[x.ID_Habitacion]?.Numero||'',hospedaje:hotelMap[roomMap[x.ID_Habitacion]?.ID_Hospedaje]||'',fecha:x.Fecha,responsable:x.Responsable||'',inicio:x.Hora_Inicio||'',fin:x.Hora_Finalizacion||'',estado:x.Estado||'Pendiente',observaciones:x.Observaciones||''})));
}catch(e){next(e)}});
router.post('/limpieza/:id/accion', allowRoles('Administrador','Recepcionista','Limpieza'), async(req,res,next)=>{try{
  res.json(await appScriptPost('accionLimpieza',{ID_Limpieza:req.params.id,Accion:req.body.accion,Responsable:req.body.responsable||req.user.nombre||req.user.sub,Observaciones:req.body.observaciones||'',Usuario_Registro:req.user.sub}));
}catch(e){next(e)}});

router.get('/pagos', async (_req,res,next)=>{try{res.json((await appScriptGet('pagos')).map(p=>({id:p.ID_Pago,reservaId:p.ID_Reserva,fecha:p.Fecha_Pago,monto:n(p.Monto),metodo:p.Metodo_Pago,concepto:p.Concepto,estado:p.Estado}))) }catch(e){next(e)}});

router.get('/registro', async (_req,res,next)=>{try{
  const [reservas,huespedes,habitaciones,hospedajes]=await Promise.all([appScriptGet('reservas'),appScriptGet('huespedes'),appScriptGet('habitaciones'),appScriptGet('hospedajes')]);
  const gh=Object.fromEntries(huespedes.map(x=>[x.ID_Huesped,[x.Nombres,x.Apellidos].filter(Boolean).join(' ')]));
  const rh=Object.fromEntries(habitaciones.map(x=>[x.ID_Habitacion,x])); const hp=Object.fromEntries(hospedajes.map(x=>[x.ID_Hospedaje,x.Nombre]));
  res.json(reservas.filter(x=>x.Estado==='Finalizada').map(x=>({id:x.ID_Reserva,nombre:gh[x.ID_Huesped]||'',habitacion:rh[x.ID_Habitacion]?.Numero||'',hospedaje:hp[rh[x.ID_Habitacion]?.ID_Hospedaje]||'',entrada:x.Fecha_Entrada,salida:x.Fecha_Salida_Real||x.Fecha_Salida,total:n(x.Pagado||x.Total),estado:x.Estado})));
}catch(e){next(e)}});

router.get('/diagnostico', adminOnly, async (_req,res,next)=>{try{
  const [hospedajes,habitaciones,reservas]=await Promise.all([appScriptGet('hospedajes'),appScriptGet('habitaciones'),appScriptGet('reservas')]);
  res.json({ok:true,hospedajes:hospedajes.length,habitaciones:habitaciones.length,reservas:reservas.length,habitacionesSinHospedaje:habitaciones.filter(x=>!x.ID_Hospedaje).length,habitacionesInactivas:habitaciones.filter(x=>String(x.Activo).toLowerCase()==='no').length});
}catch(e){next(e)}});

export default router;
