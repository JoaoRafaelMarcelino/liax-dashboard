# ============================================================
# Passo 2 - Executar no seu PC (Windows)
# Envia os arquivos .tar e o compose para a EC2 via SCP
# ============================================================
# Ajuste as variaveis abaixo antes de executar:

$EC2_USER = "ubuntu"                          # usuario da EC2 (ubuntu, ec2-user, etc.)
$EC2_HOST = "56.124.92.68"                   # IP publico da sua instancia
$EC2_KEY  = "D:\aws\chave-padrao.pem"   # caminho para o arquivo .pem
$EC2_DIR  = "/home/ubuntu/liax"               # pasta de destino na EC2

# ============================================================

$root = Split-Path $PSScriptRoot -Parent

Write-Host ">> Enviando imagens para a EC2..." -ForegroundColor Cyan

scp -i $EC2_KEY `
    "$root\scripts\liax-backend.tar" `
    "$root\scripts\liax-frontend.tar" `
    "$root\scripts\liax-legacy.tar" `
    "$EC2_USER@${EC2_HOST}:$EC2_DIR/"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO: nao foi possivel conectar na EC2." -ForegroundColor Red
    Write-Host "Verifique se a porta 22 esta liberada no Security Group para o seu IP." -ForegroundColor Red
    exit 1
}

Write-Host ">> Enviando arquivos de configuracao..." -ForegroundColor Cyan

scp -i $EC2_KEY `
    "$root\docker-compose.prod.yml" `
    "$root\scripts\3_load_and_up.sh" `
    "$EC2_USER@${EC2_HOST}:$EC2_DIR/"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO: falha ao enviar arquivos de configuracao." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Pronto! Arquivos enviados para ${EC2_HOST}:${EC2_DIR}" -ForegroundColor Green
Write-Host ""
Write-Host "Proximo passo: conecte na EC2 e execute:" -ForegroundColor Yellow
Write-Host "  ssh -i $EC2_KEY ${EC2_USER}@${EC2_HOST}"
Write-Host "  cd $EC2_DIR"
Write-Host "  bash 3_load_and_up.sh"
