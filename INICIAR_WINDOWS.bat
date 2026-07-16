@echo off
start cmd /k "cd /d %~dp0backend && if not exist .env copy .env.example .env && npm install && npm run dev"
start cmd /k "cd /d %~dp0frontend && npm install && npm run dev"
timeout /t 5 >nul
start http://localhost:5173
