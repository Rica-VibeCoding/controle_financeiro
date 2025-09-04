# ===============================================
# SOLUÇÃO DEFINITIVA: Claude WSL2 + PowerShell
# ===============================================
# Execute SEMPRE que Claude Code modificar dependências

Write-Host "Preparando ambiente para PowerShell..." -ForegroundColor Green

# 1. Matar processos Node conflitantes
Write-Host "1. Finalizando processos Node..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Remover dependências WSL2
Write-Host "2. Removendo dependências WSL2..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   Forçando remoção..." -ForegroundColor Gray
    cmd /c "rmdir /s /q node_modules" 2>$null
    if (Test-Path "node_modules") {
        Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 3. Limpar lockfiles
Write-Host "3. Limpando lockfiles..." -ForegroundColor Yellow
Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
Remove-Item "pnpm-lock.yaml" -Force -ErrorAction SilentlyContinue
Remove-Item ".npmrc" -Force -ErrorAction SilentlyContinue

# 4. Limpar caches
Write-Host "4. Limpando caches..." -ForegroundColor Yellow
npm cache clean --force
if (Test-Path ".next") { Remove-Item ".next" -Recurse -Force }

# 5. Configurar para Windows
Write-Host "5. Configurando para Windows..." -ForegroundColor Yellow
$env:npm_config_target_platform = "win32"
$env:npm_config_target_arch = "x64"

# 6. Instalar dependências Windows
Write-Host "6. Instalando para PowerShell..." -ForegroundColor Yellow
npm install --force

# 7. Testar
Write-Host "7. Testando sistema..." -ForegroundColor Yellow
npm run build

Write-Host "" 
Write-Host "PRONTO! Sistema configurado para PowerShell" -ForegroundColor Green
Write-Host "   Execute: npm run dev" -ForegroundColor Cyan
Write-Host "" 
Write-Host "DICA: Execute este script sempre que Claude modificar package.json" -ForegroundColor Yellow