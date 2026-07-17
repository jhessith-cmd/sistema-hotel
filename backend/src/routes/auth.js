import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { appScriptGet, appScriptPost } from '../services/appsScriptService.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = Router();
const normalize = value => String(value || '').trim().toLowerCase();
const publicUser = u => ({ id: u.ID_Usuario, nombre: u.Nombre_Completo, correo: u.Correo, rol: u.Rol, estado: u.Estado });

router.get('/status', async (_req, res, next) => {
  try {
    const users = await appScriptGet('usuarios');
    res.json({ configurado: users.length > 0 });
  } catch (e) { next(e); }
});

router.post('/setup', async (req, res, next) => {
  try {
    const { setupKey, nombre, correo, password } = req.body;
    if (!process.env.SETUP_KEY || setupKey !== process.env.SETUP_KEY) return res.status(403).json({ mensaje: 'Clave de instalación incorrecta' });
    const users = await appScriptGet('usuarios');
    if (users.length) return res.status(409).json({ mensaje: 'El administrador inicial ya fue creado' });
    if (!nombre || !correo || !password || password.length < 8) return res.status(400).json({ mensaje: 'Complete los datos y use una contraseña de al menos 8 caracteres' });
    const hash = await bcrypt.hash(password, 12);
    const created = await appScriptPost('crearUsuario', { Nombre_Completo: nombre, Correo: normalize(correo), Password_Hash: hash, Rol: 'Administrador', Estado: 'Activo' });
    res.status(201).json({ usuario: publicUser(created) });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const correo = normalize(req.body.correo);
    const password = String(req.body.password || '');
    const users = await appScriptGet('usuarios');
    const user = users.find(u => normalize(u.Correo) === correo);
    const valid = user && user.Estado === 'Activo' && await bcrypt.compare(password, user.Password_Hash || '');
    if (!valid) return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    const payload = { sub: user.ID_Usuario, nombre: user.Nombre_Completo, correo: user.Correo, rol: user.Rol };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    res.json({ token, usuario: publicUser(user) });
  } catch (e) { next(e); }
});

router.get('/perfil', requireAuth, (req, res) => res.json({ usuario: req.user }));

router.get('/usuarios', requireAuth, allowRoles('Administrador'), async (_req, res, next) => {
  try { res.json((await appScriptGet('usuarios')).map(publicUser)); } catch (e) { next(e); }
});

router.post('/usuarios', requireAuth, allowRoles('Administrador'), async (req, res, next) => {
  try {
    const { nombre, correo, password, rol, estado = 'Activo' } = req.body;
    if (!nombre || !correo || !password || password.length < 8) return res.status(400).json({ mensaje: 'Datos incompletos o contraseña demasiado corta' });
    const users = await appScriptGet('usuarios');
    if (users.some(u => normalize(u.Correo) === normalize(correo))) return res.status(409).json({ mensaje: 'El correo ya está registrado' });
    const hash = await bcrypt.hash(password, 12);
    const created = await appScriptPost('crearUsuario', { Nombre_Completo: nombre, Correo: normalize(correo), Password_Hash: hash, Rol: rol, Estado: estado });
    res.status(201).json(publicUser(created));
  } catch (e) { next(e); }
});

export default router;
