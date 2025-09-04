# Diagnóstico de Diferenças WSL vs PowerShell
# Execute este script em AMBOS os ambientes para comparar

Write-Host "=== DIAGNÓSTICO AMBIENTE ===" -ForegroundColor Cyan

# Informações básicas
Write-Host "Data/Hora: $(Get-Date)" -ForegroundColor Yellow
Write-Host "Ambiente: PowerShell" -ForegroundColor Yellow
Write-Host "Node Version: $(node --version)" -ForegroundColor Yellow
Write-Host "NPM Version: $(npm --version)" -ForegroundColor Yellow

# Diretório atual
Write-Host "Diretório: $(Get-Location)" -ForegroundColor Yellow

# Verificar cache
Write-Host "`n=== STATUS CACHE ===" -ForegroundColor Cyan
if (Test-Path ".next") {
    Write-Host "Cache .next EXISTS" -ForegroundColor Red
    Get-ChildItem .next -Name | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "Cache .next CLEAN" -ForegroundColor Green
}

# Verificar processos Next.js
Write-Host "`n=== PROCESSOS NEXT.JS ===" -ForegroundColor Cyan
$nextProcesses = Get-Process -Name "*node*" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*" }
if ($nextProcesses) {
    Write-Host "Processos Next.js rodando:" -ForegroundColor Red
    $nextProcesses | ForEach-Object { Write-Host "  PID: $($_.Id) - $($_.ProcessName)" }
} else {
    Write-Host "Nenhum processo Next.js rodando" -ForegroundColor Green
}

# Verificar variáveis de ambiente importantes
Write-Host "`n=== VARIÁVEIS DE AMBIENTE ===" -ForegroundColor Cyan
@("NODE_ENV", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_DEV_URL", "NEXT_PUBLIC_DEV_MODE") | ForEach-Object {
    $value = [Environment]::GetEnvironmentVariable($_)
    if ($value) {
        Write-Host "$_=$value" -ForegroundColor Yellow
    } else {
        Write-Host "$_=NOT SET" -ForegroundColor Red
    }
}

# Testar conectividade
Write-Host "`n=== TESTE CONECTIVIDADE ===" -ForegroundColor Cyan
@("http://localhost:3001", "http://127.0.0.1:3001", "http://172.19.112.1:3001") | ForEach-Object {
    try {
        $response = Invoke-WebRequest $_ -Method HEAD -TimeoutSec 2 -ErrorAction Stop
        Write-Host "$_ - OK (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "$_ - FAIL" -ForegroundColor Red
    }
}

Write-Host "`n=== COMANDOS PARA TESTAR ===" -ForegroundColor Magenta
Write-Host "1. Limpar cache: Remove-Item -Recurse -Force .next" 
Write-Host "2. Iniciar limpo: npm run dev -- -p 3001"
Write-Host "3. Testar URL: curl http://localhost:3001"

Write-Host "`nDIAGNÓSTICO COMPLETO!" -ForegroundColor Green