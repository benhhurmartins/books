$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Test-Path '.env')) { throw 'O arquivo .env nao foi encontrado.' }
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
