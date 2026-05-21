# ============================================================
# Passo 1 - Executar no seu PC (Windows)
# Gera as imagens e salva em arquivos .tar para envio a EC2
# ============================================================

$root = Split-Path $PSScriptRoot -Parent

Write-Host ">> Buildando imagens..." -ForegroundColor Cyan

docker build -t liax-backend:latest "$root\backend"
docker build -t liax-frontend:latest "$root\frontend"
docker build -t liax-legacy:latest "$root\old"

Write-Host ">> Salvando imagens em arquivos .tar..." -ForegroundColor Cyan

docker save liax-backend:latest  -o "$root\scripts\liax-backend.tar"
docker save liax-frontend:latest -o "$root\scripts\liax-frontend.tar"
docker save liax-legacy:latest   -o "$root\scripts\liax-legacy.tar"

Write-Host ""
Write-Host "Pronto! Arquivos gerados em scripts/:" -ForegroundColor Green
Write-Host "  liax-backend.tar"
Write-Host "  liax-frontend.tar"
Write-Host "  liax-legacy.tar"
Write-Host ""
Write-Host "Proximo passo: execute scripts/2_send_to_ec2.ps1" -ForegroundColor Yellow
