# Script para visualizar logs das requisições
param(
    [int]$Lines = 100,
    [string]$Filter = "",
    [switch]$Follow = $false
)

$logFile = "logs/app.log"
$logDir = "logs"

Write-Host "`n📋 Visualizador de Logs - Paygator" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Verificar se o diretório existe
if (-not (Test-Path $logDir)) {
    Write-Host "⚠️  Diretório 'logs' não encontrado. Os logs podem estar sendo exibidos apenas no console." -ForegroundColor Yellow
    Write-Host "💡 Dica: Os logs também são salvos no banco de dados (tabela api_logs).`n" -ForegroundColor Yellow
    exit
}

# Listar arquivos de log disponíveis
Write-Host "📁 Arquivos de log disponíveis:" -ForegroundColor Green
Get-ChildItem $logDir -Filter *.log | ForEach-Object {
    $size = [math]::Round($_.Length / 1KB, 2)
    Write-Host "   - $($_.Name) ($size KB) - Última modificação: $($_.LastWriteTime)" -ForegroundColor Gray
}
Write-Host ""

# Verificar se o arquivo principal existe
if (-not (Test-Path $logFile)) {
    Write-Host "⚠️  Arquivo '$logFile' não encontrado." -ForegroundColor Yellow
    Write-Host "💡 Os logs podem estar sendo exibidos apenas no console do Node.js.`n" -ForegroundColor Yellow
    exit
}

# Mostrar últimas linhas
Write-Host "📄 Últimas $Lines linhas do log (app.log):" -ForegroundColor Green
Write-Host "----------------------------------------`n" -ForegroundColor Gray

if ($Filter) {
    Get-Content $logFile -Tail $Lines | Select-String -Pattern $Filter | ForEach-Object {
        Write-Host $_
    }
} else {
    Get-Content $logFile -Tail $Lines | ForEach-Object {
        # Colorir por nível de log
        if ($_ -match '"level":"error"') {
            Write-Host $_ -ForegroundColor Red
        } elseif ($_ -match '"level":"warn"') {
            Write-Host $_ -ForegroundColor Yellow
        } elseif ($_ -match '"level":"info"') {
            Write-Host $_ -ForegroundColor Cyan
        } else {
            Write-Host $_ -ForegroundColor White
        }
    }
}

if ($Follow) {
    Write-Host "`nSeguindo logs em tempo real (Ctrl+C para sair)..." -ForegroundColor Green
    Get-Content $logFile -Wait -Tail 10
}

Write-Host "`n✅ Fim dos logs`n" -ForegroundColor Green

