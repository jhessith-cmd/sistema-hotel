@echo off
start "HotelControl Backend" cmd /k "cd /d %~dp0backend && if not exist .env copy .env.example .env && yarn start"
start "HotelControl Frontend" cmd /k "cd /d %~dp0frontend && if not exist .env copy .env.example .env && npm run dev"
