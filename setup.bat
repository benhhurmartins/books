@echo off
setlocal
cd /d "%~dp0"
if not exist .env (
  echo O arquivo .env nao foi encontrado.
  exit /b 1
)
call npm install
if errorlevel 1 exit /b 1
call npx prisma generate
if errorlevel 1 exit /b 1
call npx prisma db push
if errorlevel 1 exit /b 1
call npm run seed
if errorlevel 1 exit /b 1
call npm run dev
