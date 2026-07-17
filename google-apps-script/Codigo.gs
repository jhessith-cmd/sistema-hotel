const TOKEN_SECRETO = 'CAMBIAR_TOKEN_LARGO';

function setupHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schema = {
    Usuarios:['ID_Usuario','Nombre_Completo','Correo','Password_Hash','Rol','Estado','Fecha_Registro'],
    Habitaciones:['ID_Habitacion','Numero','Tipo','Capacidad','Precio','Estado','Piso','Observaciones','Fecha_Registro'],
    Huespedes:['ID_Huesped','Nombres','Apellidos','Documento','Tipo_Documento','Telefono','Correo','Nacionalidad','Direccion','Observaciones','Fecha_Registro'],
    Reservas:['ID_Reserva','ID_Huesped','ID_Habitacion','Fecha_Reserva','Fecha_Entrada','Fecha_Salida','Cantidad_Personas','Precio_Noche','Cantidad_Noches','Total','Adelanto','Saldo','Estado','Observaciones','Usuario_Registro'],
    Pagos:['ID_Pago','ID_Reserva','Fecha_Pago','Monto','Metodo_Pago','Numero_Comprobante','Concepto','Estado','Observaciones','Usuario_Registro'],
    Limpieza:['ID_Limpieza','ID_Habitacion','Fecha','Responsable','Hora_Inicio','Hora_Finalizacion','Estado','Observaciones','Foto_URL'],
    Mantenimiento:['ID_Mantenimiento','ID_Habitacion','Fecha_Reporte','Problema','Prioridad','Responsable','Estado','Fecha_Solucion','Observaciones','Foto_URL'],
    Auditoria:['ID_Auditoria','Fecha_Hora','ID_Usuario','Accion','Modulo','ID_Registro','Datos_Anteriores','Datos_Nuevos'],
    Configuracion:['Clave','Valor','Descripcion']
  };
  Object.keys(schema).forEach(nombre => {
    let hoja = ss.getSheetByName(nombre);
    if (!hoja) hoja = ss.insertSheet(nombre);
    if (hoja.getLastRow() === 0) hoja.getRange(1,1,1,schema[nombre].length).setValues([schema[nombre]]);
    hoja.setFrozenRows(1);
    hoja.getRange(1,1,1,schema[nombre].length).setFontWeight('bold').setBackground('#102a43').setFontColor('#ffffff');
    hoja.autoResizeColumns(1,schema[nombre].length);
  });
}

function doGet(e) {
  try {
    validarToken(e.parameter.token);
    const mapa = { usuarios:'Usuarios', habitaciones:'Habitaciones', huespedes:'Huespedes', reservas:'Reservas', pagos:'Pagos', limpieza:'Limpieza', mantenimiento:'Mantenimiento' };
    const hoja = mapa[e.parameter.accion];
    if (!hoja) return json({ok:false,mensaje:'Acción no reconocida'});
    return json({ok:true,datos:obtenerRegistros(hoja)});
  } catch (error) { return json({ok:false,mensaje:error.message}); }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    validarToken(body.token);
    const d = body.datos || {};
    if (body.accion === 'crearUsuario') return crear('Usuarios', {ID_Usuario:generarId('USR','Usuarios'),Nombre_Completo:d.Nombre_Completo,Correo:String(d.Correo||'').toLowerCase(),Password_Hash:d.Password_Hash,Rol:d.Rol||'Recepcionista',Estado:d.Estado||'Activo',Fecha_Registro:fechaHoy()});
    if (body.accion === 'crearHabitacion') return crear('Habitaciones', {ID_Habitacion:generarId('HAB','Habitaciones'),Numero:d.Numero,Tipo:d.Tipo,Capacidad:d.Capacidad,Precio:d.Precio,Estado:d.Estado||'Disponible',Piso:d.Piso,Observaciones:d.Observaciones||'',Fecha_Registro:fechaHoy()});
    if (body.accion === 'crearHuesped') return crear('Huespedes', {ID_Huesped:generarId('HUE','Huespedes'),Nombres:d.Nombres,Apellidos:d.Apellidos,Documento:d.Documento,Tipo_Documento:d.Tipo_Documento||'CI',Telefono:d.Telefono||'',Correo:d.Correo||'',Nacionalidad:d.Nacionalidad||'Boliviana',Direccion:d.Direccion||'',Observaciones:d.Observaciones||'',Fecha_Registro:fechaHoy()});
    if (body.accion === 'crearReserva') { validarReserva(d); const noches=calcularNoches(d.Fecha_Entrada,d.Fecha_Salida), total=noches*Number(d.Precio_Noche||0), adelanto=Number(d.Adelanto||0); return crear('Reservas',{ID_Reserva:generarId('RES','Reservas'),ID_Huesped:d.ID_Huesped,ID_Habitacion:d.ID_Habitacion,Fecha_Reserva:fechaHoy(),Fecha_Entrada:d.Fecha_Entrada,Fecha_Salida:d.Fecha_Salida,Cantidad_Personas:d.Cantidad_Personas,Precio_Noche:d.Precio_Noche,Cantidad_Noches:noches,Total:total,Adelanto:adelanto,Saldo:total-adelanto,Estado:d.Estado||'Confirmada',Observaciones:d.Observaciones||'',Usuario_Registro:d.Usuario_Registro||'Sistema'}); }
    if (body.accion === 'crearPago') return crear('Pagos',{ID_Pago:generarId('PAG','Pagos'),ID_Reserva:d.ID_Reserva,Fecha_Pago:fechaHoy(),Monto:d.Monto,Metodo_Pago:d.Metodo_Pago,Numero_Comprobante:d.Numero_Comprobante||'',Concepto:d.Concepto||'Pago de hospedaje',Estado:d.Estado||'Confirmado',Observaciones:d.Observaciones||'',Usuario_Registro:d.Usuario_Registro||'Sistema'});
    return json({ok:false,mensaje:'Acción no reconocida'});
  } catch (error) { return json({ok:false,mensaje:error.message}); }
}

function crear(hoja,registro){agregarRegistro(hoja,registro);return json({ok:true,datos:registro});}
function obtenerHoja(nombre){const h=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);if(!h)throw new Error('No existe la hoja '+nombre);return h;}
function obtenerRegistros(nombre){const v=obtenerHoja(nombre).getDataRange().getDisplayValues();if(v.length<2)return[];const e=v[0];return v.slice(1).filter(f=>f.some(c=>c!=='')).map(f=>Object.fromEntries(e.map((k,i)=>[k,f[i]])));}
function agregarRegistro(nombre,r){const h=obtenerHoja(nombre),e=h.getRange(1,1,1,h.getLastColumn()).getValues()[0];h.appendRow(e.map(k=>r[k]??''));}
function generarId(prefijo,nombre){const h=obtenerHoja(nombre),n=Math.max(1,h.getLastRow());let siguiente=1;if(n>1){const id=h.getRange(n,1).getDisplayValue(),m=id.match(/-(\d+)$/);if(m)siguiente=Number(m[1])+1;}return prefijo+'-'+String(siguiente).padStart(4,'0');}
function validarReserva(d){if(!d.ID_Huesped||!d.ID_Habitacion||!d.Fecha_Entrada||!d.Fecha_Salida)throw new Error('Datos de reserva incompletos');const a=convertirFecha(d.Fecha_Entrada),b=convertirFecha(d.Fecha_Salida);if(b<=a)throw new Error('La salida debe ser posterior a la entrada');const choque=obtenerRegistros('Reservas').some(r=>r.ID_Habitacion===d.ID_Habitacion&&!['Cancelada','Finalizada'].includes(r.Estado)&&a<convertirFecha(r.Fecha_Salida)&&b>convertirFecha(r.Fecha_Entrada));if(choque)throw new Error('La habitación ya tiene una reserva en esas fechas');}
function convertirFecha(v){if(String(v).includes('-')){const p=String(v).split('-');return new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));}const p=String(v).split('/');return new Date(Number(p[2]),Number(p[1])-1,Number(p[0]));}
function calcularNoches(a,b){return Math.ceil((convertirFecha(b)-convertirFecha(a))/86400000);}
function fechaHoy(){return Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd/MM/yyyy');}
function validarToken(t){if(t!==TOKEN_SECRETO)throw new Error('Acceso no autorizado');}
function json(d){return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON);}
