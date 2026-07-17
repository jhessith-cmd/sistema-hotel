const TOKEN_SECRETO = 'CAMBIAR_TOKEN_LARGO';

function setupHojas(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const schema={
    Usuarios:['ID_Usuario','Nombre_Completo','Correo','Password_Hash','Rol','Estado','Fecha_Registro'],
    Hospedajes:['ID_Hospedaje','Nombre','Direccion','Estado','Fecha_Registro'],
    Habitaciones:['ID_Habitacion','ID_Hospedaje','Numero','Tipo','Capacidad','Precio','Estado','Piso','Activo','Observaciones','Fecha_Registro'],
    Huespedes:['ID_Huesped','Nombres','Apellidos','Documento','Tipo_Documento','Telefono','Correo','Nacionalidad','Direccion','Observaciones','Fecha_Registro'],
    Reservas:['ID_Reserva','ID_Huesped','ID_Habitacion','Fecha_Reserva','Fecha_Entrada','Fecha_Salida','Cantidad_Personas','Precio_Noche','Cantidad_Noches','Total','Adelanto','Pagado','Saldo','Estado','Observaciones','Fecha_Ingreso_Real','Hora_Ingreso','Fecha_Salida_Real','Usuario_Registro'],
    Pagos:['ID_Pago','ID_Reserva','Fecha_Pago','Monto','Metodo_Pago','Numero_Comprobante','Concepto','Estado','Observaciones','Usuario_Registro'],
    Limpieza:['ID_Limpieza','ID_Habitacion','Fecha','Responsable','Hora_Inicio','Hora_Finalizacion','Estado','Observaciones','Foto_URL'],
    Mantenimiento:['ID_Mantenimiento','ID_Habitacion','Fecha_Reporte','Problema','Prioridad','Responsable','Estado','Fecha_Solucion','Observaciones','Foto_URL'],
    Auditoria:['ID_Auditoria','Fecha_Hora','ID_Usuario','Accion','Modulo','ID_Registro','Datos_Anteriores','Datos_Nuevos'],
    Configuracion:['Clave','Valor','Descripcion']
  };
  Object.keys(schema).forEach(nombre=>{
    let h=ss.getSheetByName(nombre); if(!h)h=ss.insertSheet(nombre);
    const headers=schema[nombre];
    if(h.getLastRow()===0)h.getRange(1,1,1,headers.length).setValues([headers]);
    else{
      const current=h.getRange(1,1,1,Math.max(h.getLastColumn(),headers.length)).getDisplayValues()[0];
      headers.forEach((x,i)=>{if(current[i]!==x)h.getRange(1,i+1).setValue(x)});
    }
    h.setFrozenRows(1);h.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#0f3b3a').setFontColor('#fff');h.autoResizeColumns(1,headers.length);
  });
  const hosp=ss.getSheetByName('Hospedajes'); if(hosp.getLastRow()===1)hosp.appendRow(['HOS-0001','Hospedaje 1','','Activo',fechaHoy()]);
}

function doGet(e){try{validarToken(e.parameter.token);const mapa={usuarios:'Usuarios',hospedajes:'Hospedajes',habitaciones:'Habitaciones',huespedes:'Huespedes',reservas:'Reservas',pagos:'Pagos',limpieza:'Limpieza',mantenimiento:'Mantenimiento'};const hoja=mapa[e.parameter.accion];if(!hoja)return json({ok:false,mensaje:'Acción no reconocida'});return json({ok:true,datos:obtenerRegistros(hoja)});}catch(error){return json({ok:false,mensaje:error.message});}}

function doPost(e){
  try{
    const body=JSON.parse(e.postData.contents||'{}');validarToken(body.token);const d=body.datos||{};
    if(body.accion==='crearUsuario')return crear('Usuarios',{ID_Usuario:generarId('USR','Usuarios'),Nombre_Completo:d.Nombre_Completo,Correo:String(d.Correo||'').toLowerCase(),Password_Hash:d.Password_Hash,Rol:d.Rol||'Recepcionista',Estado:d.Estado||'Activo',Fecha_Registro:fechaHoy()});
    if(body.accion==='crearHospedaje')return crear('Hospedajes',{ID_Hospedaje:generarId('HOS','Hospedajes'),Nombre:d.Nombre,Direccion:d.Direccion||'',Estado:d.Estado||'Activo',Fecha_Registro:fechaHoy()});
    if(body.accion==='actualizarHospedaje')return actualizarPorId('Hospedajes','ID_Hospedaje',d.ID_Hospedaje,{Nombre:d.Nombre,Direccion:d.Direccion||'',Estado:d.Estado||'Activo'});
    if(body.accion==='crearHabitacion')return crear('Habitaciones',{ID_Habitacion:generarId('HAB','Habitaciones'),ID_Hospedaje:d.ID_Hospedaje,Numero:d.Numero,Tipo:d.Tipo,Capacidad:d.Capacidad,Precio:d.Precio,Estado:d.Estado||'Disponible',Piso:d.Piso,Activo:d.Activo||'Sí',Observaciones:d.Observaciones||'',Fecha_Registro:fechaHoy()});
    if(body.accion==='actualizarHabitacion')return actualizarPorId('Habitaciones','ID_Habitacion',d.ID_Habitacion,{Numero:d.numero,Tipo:d.tipo,Capacidad:d.capacidad,Precio:d.precio,Estado:d.estado,Piso:d.piso,Activo:d.activo,Observaciones:d.observaciones,ID_Hospedaje:d.hospedajeId});
    if(body.accion==='crearHuesped')return crear('Huespedes',{ID_Huesped:generarId('HUE','Huespedes'),Nombres:d.Nombres,Apellidos:d.Apellidos,Documento:d.Documento,Tipo_Documento:d.Tipo_Documento||'CI',Telefono:d.Telefono||'',Correo:d.Correo||'',Nacionalidad:d.Nacionalidad||'Boliviana',Direccion:d.Direccion||'',Observaciones:d.Observaciones||'',Fecha_Registro:fechaHoy()});
    if(body.accion==='crearReserva'){
      validarReserva(d);const noches=calcularNoches(d.Fecha_Entrada,d.Fecha_Salida),total=noches*Number(d.Precio_Noche||0),adelanto=Number(d.Adelanto||0),ocupada=d.Estado==='Ocupada';
      const r={ID_Reserva:generarId('RES','Reservas'),ID_Huesped:d.ID_Huesped,ID_Habitacion:d.ID_Habitacion,Fecha_Reserva:fechaHoy(),Fecha_Entrada:d.Fecha_Entrada,Fecha_Salida:d.Fecha_Salida,Cantidad_Personas:d.Cantidad_Personas,Precio_Noche:d.Precio_Noche,Cantidad_Noches:noches,Total:total,Adelanto:adelanto,Pagado:adelanto,Saldo:total-adelanto,Estado:d.Estado||'Confirmada',Observaciones:d.Observaciones||'',Fecha_Ingreso_Real:ocupada?fechaHoy():'',Hora_Ingreso:ocupada?horaActual():'',Fecha_Salida_Real:'',Usuario_Registro:d.Usuario_Registro||'Sistema'};
      const out=crear('Reservas',r);actualizarEstadoHabitacion(d.ID_Habitacion,ocupada?'Ocupada':'Reservada');if(adelanto>0)crearPagoInterno(r.ID_Reserva,adelanto,'Efectivo','Adelanto',d.Usuario_Registro);return out;
    }
    if(body.accion==='accionReserva')return accionReserva(d);
    if(body.accion==='crearPago')return crearPagoInterno(d.ID_Reserva,d.Monto,d.Metodo_Pago,d.Concepto||'Pago de hospedaje',d.Usuario_Registro,d.Observaciones||'');
    return json({ok:false,mensaje:'Acción no reconocida'});
  }catch(error){return json({ok:false,mensaje:error.message});}
}

function accionReserva(d){
  const reserva=buscarPorId('Reservas','ID_Reserva',d.ID_Reserva);if(!reserva)throw new Error('Reserva no encontrada');
  if(d.Accion==='entrada'){
    actualizarPorId('Reservas','ID_Reserva',d.ID_Reserva,{Estado:'Ocupada',Fecha_Ingreso_Real:d.Fecha||fechaHoy(),Hora_Ingreso:d.Hora||horaActual(),Observaciones:combinarObs(reserva.Observaciones,d.Observaciones)});actualizarEstadoHabitacion(reserva.ID_Habitacion,'Ocupada');auditar(d.Usuario_Registro,'Registrar entrada','Reservas',d.ID_Reserva);return json({ok:true,mensaje:'Entrada registrada'});
  }
  if(d.Accion==='pago'){
    const monto=Number(d.Monto||0);if(monto<=0)throw new Error('Monto inválido');crearPagoInterno(d.ID_Reserva,monto,d.Metodo_Pago||'Efectivo','Pago de hospedaje',d.Usuario_Registro,d.Observaciones);const pagado=Number(reserva.Pagado||reserva.Adelanto||0)+monto;actualizarPorId('Reservas','ID_Reserva',d.ID_Reserva,{Pagado:pagado,Saldo:Math.max(0,Number(reserva.Total)-pagado)});return json({ok:true,mensaje:'Pago registrado'});
  }
  if(d.Accion==='editar'){
    const nuevaSalida=d.Fecha_Salida||reserva.Fecha_Salida;const noches=calcularNoches(reserva.Fecha_Entrada,nuevaSalida);const total=d.Total!==undefined&&d.Total!==''?Number(d.Total):Number(reserva.Precio_Noche)*noches;const pagado=Number(reserva.Pagado||reserva.Adelanto||0);
    actualizarPorId('Reservas','ID_Reserva',d.ID_Reserva,{Fecha_Salida:nuevaSalida,Cantidad_Noches:noches,Total:total,Saldo:Math.max(0,total-pagado),ID_Habitacion:d.ID_Habitacion||reserva.ID_Habitacion,Cantidad_Personas:d.Cantidad_Personas||reserva.Cantidad_Personas,Observaciones:combinarObs(reserva.Observaciones,d.Observaciones)});return json({ok:true,mensaje:'Estadía actualizada'});
  }
  if(d.Accion==='cancelar'){
    actualizarPorId('Reservas','ID_Reserva',d.ID_Reserva,{Estado:'Cancelada',Observaciones:combinarObs(reserva.Observaciones,d.Observaciones)});actualizarEstadoHabitacion(reserva.ID_Habitacion,'Disponible');auditar(d.Usuario_Registro,'Cancelar reserva','Reservas',d.ID_Reserva);return json({ok:true,mensaje:'Reserva cancelada'});
  }
  if(d.Accion==='salida'){
    const saldo=Number(reserva.Saldo||0);if(saldo>0&&Number(d.Monto||0)>0)crearPagoInterno(d.ID_Reserva,Number(d.Monto),d.Metodo_Pago||'Efectivo','Pago final',d.Usuario_Registro,d.Observaciones);
    const actualizado=buscarPorId('Reservas','ID_Reserva',d.ID_Reserva);const pagoFinal=Number(actualizado.Pagado||actualizado.Adelanto||0)+Math.max(0,Number(d.Monto||0));
    actualizarPorId('Reservas','ID_Reserva',d.ID_Reserva,{Estado:'Finalizada',Fecha_Salida_Real:d.Fecha||fechaHoy(),Pagado:pagoFinal,Saldo:0});actualizarEstadoHabitacion(reserva.ID_Habitacion,'Limpieza');auditar(d.Usuario_Registro,'Registrar salida','Reservas',d.ID_Reserva);return json({ok:true,mensaje:'Salida registrada; habitación en limpieza'});
  }
  throw new Error('Acción no reconocida');
}

function crearPagoInterno(id,monto,metodo,concepto,usuario,obs){const reg={ID_Pago:generarId('PAG','Pagos'),ID_Reserva:id,Fecha_Pago:fechaHoy(),Monto:Number(monto||0),Metodo_Pago:metodo||'Efectivo',Numero_Comprobante:'',Concepto:concepto||'Pago',Estado:'Confirmado',Observaciones:obs||'',Usuario_Registro:usuario||'Sistema'};agregarRegistro('Pagos',reg);return json({ok:true,datos:reg});}
function actualizarEstadoHabitacion(id,estado){actualizarPorId('Habitaciones','ID_Habitacion',id,{Estado:estado});}
function crear(hoja,registro){agregarRegistro(hoja,registro);return json({ok:true,datos:registro});}
function obtenerHoja(nombre){const h=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);if(!h)throw new Error('No existe la hoja '+nombre);return h;}
function obtenerRegistros(nombre){const v=obtenerHoja(nombre).getDataRange().getDisplayValues();if(v.length<2)return[];const e=v[0];return v.slice(1).filter(f=>f.some(c=>c!=='')).map(f=>Object.fromEntries(e.map((k,i)=>[k,f[i]])));}
function agregarRegistro(nombre,r){const h=obtenerHoja(nombre),e=h.getRange(1,1,1,h.getLastColumn()).getValues()[0];h.appendRow(e.map(k=>r[k]??''));}
function buscarPorId(nombre,campo,id){return obtenerRegistros(nombre).find(x=>x[campo]===id);}
function actualizarPorId(nombre,campo,id,cambios){const h=obtenerHoja(nombre),data=h.getDataRange().getValues(),headers=data[0],idx=headers.indexOf(campo);for(let i=1;i<data.length;i++){if(String(data[i][idx])===String(id)){Object.keys(cambios).forEach(k=>{if(cambios[k]!==undefined&&cambios[k]!==null&&cambios[k]!==''){const c=headers.indexOf(k);if(c>=0)h.getRange(i+1,c+1).setValue(cambios[k]);}});return json({ok:true,mensaje:'Actualizado'});}}throw new Error('Registro no encontrado');}
function generarId(prefijo,nombre){const h=obtenerHoja(nombre),n=Math.max(1,h.getLastRow());let siguiente=1;if(n>1){const id=h.getRange(n,1).getDisplayValue(),m=id.match(/-(\d+)$/);if(m)siguiente=Number(m[1])+1;}return prefijo+'-'+String(siguiente).padStart(4,'0');}
function validarReserva(d){if(!d.ID_Huesped||!d.ID_Habitacion||!d.Fecha_Entrada||!d.Fecha_Salida)throw new Error('Datos de reserva incompletos');const a=convertirFecha(d.Fecha_Entrada),b=convertirFecha(d.Fecha_Salida);if(b<=a)throw new Error('La salida debe ser posterior a la entrada');const choque=obtenerRegistros('Reservas').some(r=>r.ID_Habitacion===d.ID_Habitacion&&!['Cancelada','Finalizada'].includes(r.Estado)&&a<convertirFecha(r.Fecha_Salida)&&b>convertirFecha(r.Fecha_Entrada));if(choque)throw new Error('La habitación ya tiene una reserva en esas fechas');}
function convertirFecha(v){if(String(v).includes('-')){const p=String(v).split('-');return new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));}const p=String(v).split('/');return new Date(Number(p[2]),Number(p[1])-1,Number(p[0]));}
function calcularNoches(a,b){return Math.max(1,Math.ceil((convertirFecha(b)-convertirFecha(a))/86400000));}
function fechaHoy(){return Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd/MM/yyyy');}
function horaActual(){return Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'HH:mm');}
function combinarObs(a,b){return [a,b].filter(Boolean).join(' | ');}
function auditar(usuario,accion,modulo,id){agregarRegistro('Auditoria',{ID_Auditoria:generarId('AUD','Auditoria'),Fecha_Hora:Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm'),ID_Usuario:usuario||'Sistema',Accion:accion,Modulo:modulo,ID_Registro:id,Datos_Anteriores:'',Datos_Nuevos:''});}
function validarToken(t){if(t!==TOKEN_SECRETO)throw new Error('Acceso no autorizado');}
function json(d){return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON);}
