import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import api from './routes/api.js';

const app=express();
app.use(cors({origin:true}));
app.use(express.json());
app.get('/',(_req,res)=>res.json({sistema:'Sistema de Administración Hotelera',estado:'activo'}));
app.use('/api',api);
app.use((err,_req,res,_next)=>{console.error(err);res.status(500).json({mensaje:'Error interno',detalle:process.env.NODE_ENV==='production'?undefined:err.message});});
const port=process.env.PORT||4000;
app.listen(port,()=>console.log(`Backend: http://localhost:${port} | modo: ${process.env.DATA_MODE||'mock'}`));
