# Script simples para iniciar Backend e Dashboard

Write-Host "Iniciando Backend e Dashboard..." -ForegroundColor Cyan
Write-Host ""

# Parar processos anteriores
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Iniciar Backend
Write-Host "Iniciando Backend (Porta 3000)..." -ForegroundColor Green
$backendPath = "C:\Users\isacataria\Documents\GitHub\nebula\Paygator_v2"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"

# Aguardar
Start-Sleep -Seconds 3

# Iniciar Dashboard
Write-Host "Iniciando Dashboard React (Porta 3001)..." -ForegroundColor Blue
$dashboardPath = "C:\Users\isacataria\Documents\GitHub\nebula\Paygator_v2\dashboard"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$dashboardPath'; npm run dev"

Write-Host ""
Write-Host "Servidores iniciados!" -ForegroundColor Green
Write-Host "Backend:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "Dashboard: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""

