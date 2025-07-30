# Script para iniciar Docker Desktop no Windows
Write-Host "🐳 Iniciando Docker Desktop..." -ForegroundColor Green

# Verificar se Docker Desktop está instalado
$dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerPath) {
    Write-Host "✅ Docker Desktop encontrado" -ForegroundColor Green
    
    # Tentar iniciar Docker Desktop
    try {
        Write-Host "🚀 Iniciando Docker Desktop..." -ForegroundColor Yellow
        Start-Process $dockerPath -WindowStyle Hidden
        
        # Aguardar Docker inicializar
        Write-Host "⏳ Aguardando Docker inicializar..." -ForegroundColor Yellow
        $maxAttempts = 30
        $attempt = 0
        
        while ($attempt -lt $maxAttempts) {
            try {
                $result = docker ps 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Docker Desktop iniciado com sucesso!" -ForegroundColor Green
                    break
                }
            } catch {
                # Ignorar erro
            }
            
            $attempt++
            Write-Host "⏳ Aguardando... ($attempt/$maxAttempts)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
        
        if ($attempt -eq $maxAttempts) {
            Write-Host "❌ Docker não inicializou em tempo hábil" -ForegroundColor Red
            Write-Host "💡 Verifique se Docker Desktop está rodando manualmente" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Erro ao iniciar Docker Desktop: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Inicie Docker Desktop manualmente" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Docker Desktop não encontrado" -ForegroundColor Red
    Write-Host "💡 Instale Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Verifique se Docker Desktop está rodando" -ForegroundColor White
Write-Host "2. Execute: npm run setup-docker" -ForegroundColor White
Write-Host "3. Teste: npm run test-db" -ForegroundColor White 