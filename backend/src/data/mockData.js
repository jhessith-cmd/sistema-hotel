export const db = {
  habitaciones: [
    { id: 'HAB-001', numero: '101', tipo: 'Simple', capacidad: 1, precio: 150, estado: 'Disponible', piso: 1, observaciones: '' },
    { id: 'HAB-002', numero: '102', tipo: 'Matrimonial', capacidad: 2, precio: 250, estado: 'Ocupada', piso: 1, observaciones: '' },
    { id: 'HAB-003', numero: '201', tipo: 'Familiar', capacidad: 4, precio: 400, estado: 'Limpieza', piso: 2, observaciones: 'Salida reciente' },
    { id: 'HAB-004', numero: '202', tipo: 'Doble', capacidad: 2, precio: 280, estado: 'Mantenimiento', piso: 2, observaciones: 'Revisar ducha' }
  ],
  huespedes: [
    { id: 'HUE-001', nombre: 'María López', documento: '7845123', telefono: '70000001', correo: 'maria@example.com', nacionalidad: 'Boliviana' },
    { id: 'HUE-002', nombre: 'Carlos Rojas', documento: '5687412', telefono: '70000002', correo: 'carlos@example.com', nacionalidad: 'Boliviana' }
  ],
  reservas: [
    { id: 'RES-001', huespedId: 'HUE-002', habitacionId: 'HAB-002', entrada: '2026-07-15', salida: '2026-07-18', personas: 2, estado: 'En curso', total: 750, pagado: 500 }
  ]
};
