# Script para iniciar Backend e Dashboard React

Write-Host "🚀 Iniciando Paygator Backend e Dashboard..." -ForegroundColor Cyan

# Verificar se o dashboard tem node_modules
if (-not (Test-Path "dashboard\node_modules")) {
    Write-Host "📦 Instalando dependências do dashboard..." -ForegroundColor Yellow
    Set-Location dashboard
    npm install
    Set-Location ..
}

# Iniciar Backend em uma nova janela
Write-Host "🔧 Iniciando Backend na porta 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🔧 Backend (Porta 3000)' -ForegroundColor Green; npm run dev"

# Aguardar um pouco antes de iniciar o dashboard
Start-Sleep -Seconds 3

# Iniciar Dashboard React em outra nova janela
Write-Host "⚛️  Iniciando Dashboard React na porta 3001..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\dashboard'; Write-Host '⚛️  Dashboard React (Porta 3001)' -ForegroundColor Blue; npm run dev"

Write-Host ""
Write-Host "✅ Ambos os servidores foram iniciados!" -ForegroundColor Green
Write-Host "   Backend:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Dashboard:  http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

