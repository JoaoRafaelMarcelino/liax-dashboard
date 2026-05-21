# Deploy Genérico para AWS EC2 (Docker Images)

Este documento descreve um fluxo de deploy genérico para AWS EC2 usando imagens Docker pré-buildadas localmente, evitando builds na instância (útil quando não há acesso a Docker Hub ou há problemas de rede/DNS).

## Visão Geral

O fluxo consiste em:
1. **Build local** → imagens Docker são criadas no seu PC
2. **Exportação** → imagens são salvas em arquivos `.tar`
3. **Envio** → arquivos `.tar` são copiados para a EC2 via SCP
4. **Load e Up** → imagens são carregadas e containers reiniciados na EC2

## Estrutura de Arquivos Sugerida

```
projeto/
├── docker-compose.prod.yml    # compose de produção (usa `image:` em vez de `build:`)
├── scripts/
│   ├── 1_build_and_save.ps1   # build local + export .tar
│   ├── 2_send_to_ec2.ps1      # envio via SCP para EC2
│   └── 3_load_and_up.sh       # load imagens + up containers na EC2
└── .env.prod                  # variáveis de ambiente (não commitar)
```

## Configuração Inicial (primeira vez)

### 1. Configurar chaves SSH (Windows)

A chave `.pem` precisa ter permissões restritas apenas ao seu usuário:

```powershell
$KEY_PATH = "C:\caminho\para\sua-chave.pem"

icacls $KEY_PATH /inheritance:r
icacls $KEY_PATH /remove *S-1-5-11
icacls $KEY_PATH /remove *S-1-5-32-545
icacls $KEY_PATH /grant "$env:USERNAME`:R"
```

### 2. Configurar Security Group na AWS

No Console da AWS → EC2 → Security Groups:
- Adicionar regra inbound: **SSH (22)** → Source: **My IP**

### 3. Criar docker-compose.prod.yml

Exemplo genérico (adapte para seus serviços):

```yaml
services:
  backend:
    image: seu-backend:latest
    container_name: seu-backend-prod
    ports:
      - "8000:8000"
    env_file:
      - .env.prod
    restart: unless-stopped

  frontend:
    image: seu-frontend:latest
    container_name: seu-frontend-prod
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 4. Criar Scripts

#### `scripts/1_build_and_save.ps1`

```powershell
$root = Split-Path $PSScriptRoot -Parent

Write-Host ">> Buildando imagens..." -ForegroundColor Cyan

# Build suas imagens (adapte conforme necessário)
docker build -t seu-backend:latest "$root\backend"
docker build -t seu-frontend:latest "$root\frontend"

Write-Host ">> Salvando imagens em arquivos .tar..." -ForegroundColor Cyan

docker save seu-backend:latest  -o "$root\scripts\backend.tar"
docker save seu-frontend:latest -o "$root\scripts\frontend.tar"

Write-Host ""
Write-Host "Pronto! Arquivos gerados em scripts/" -ForegroundColor Green
```

#### `scripts/2_send_to_ec2.ps1`

```powershell
# Configure conforme seu ambiente
$EC2_USER = "ubuntu"
$EC2_HOST = "SEU_IP_EC2"
$EC2_KEY  = "C:\caminho\chave.pem"
$EC2_DIR  = "/home/ubuntu/projeto"

$root = Split-Path $PSScriptRoot -Parent

Write-Host ">> Enviando imagens para a EC2..." -ForegroundColor Cyan

scp -i $EC2_KEY `
    "$root\scripts\backend.tar" `
    "$root\scripts\frontend.tar" `
    "$EC2_USER@${EC2_HOST}:$EC2_DIR/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: nao foi possivel conectar na EC2." -ForegroundColor Red
    exit 1
}

Write-Host ">> Enviando arquivos de configuracao..." -ForegroundColor Cyan

scp -i $EC2_KEY `
    "$root\docker-compose.prod.yml" `
    "$root\scripts\3_load_and_up.sh" `
    "$EC2_USER@${EC2_HOST}:$EC2_DIR/"

Write-Host ""
Write-Host "Pronto! Arquivos enviados para ${EC2_HOST}:${EC2_DIR}" -ForegroundColor Green
```

#### `scripts/3_load_and_up.sh`

```bash
#!/bin/bash
set -e

EC2_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ">> Carregando imagens..."
docker load -i "$EC2_DIR/backend.tar"
docker load -i "$EC2_DIR/frontend.tar"

echo ">> Parando containers anteriores..."
docker compose -f "$EC2_DIR/docker-compose.prod.yml" down 2>/dev/null || true

echo ">> Subindo containers..."
docker compose -f "$EC2_DIR/docker-compose.prod.yml" up -d --force-recreate

echo ""
echo "Pronto! Containers no ar:"
docker compose -f "$EC2_DIR/docker-compose.prod.yml" ps
```

### 5. Primeiro Deploy

```powershell
# No seu PC
.\scripts\1_build_and_save.ps1
.\scripts\2_send_to_ec2.ps1
```

```bash
# Na EC2
ssh -i /caminho/chave.pem ubuntu@SEU_IP_EC2
cd /home/ubuntu/projeto

# Criar .env.prod
cp .env.prod.example .env.prod  # se tiver template
nano .env.prod  # ou vim

# Subir containers
bash 3_load_and_up.sh
```

## Deploy de Atualizações (fluxo padrão)

Sempre que fizer alterações no código:

### Passo 1 - No seu PC

```powershell
.\scripts\1_build_and_save.ps1
.\scripts\2_send_to_ec2.ps1
```

### Passo 2 - Na EC2

```bash
cd /home/ubuntu/projeto
bash 3_load_and_up.sh
```

## Deploy Otimizado (só o que mudou)

Se alterou **só um serviço**, não precisa rebuildar tudo:

```powershell
# Exemplo: só backend mudou
docker build -t seu-backend:latest ./backend
docker save seu-backend:latest -o scripts\backend.tar
scp -i C:\caminho\chave.pem scripts\backend.tar ubuntu@SEU_IP_EC2:/home/ubuntu/projeto/
```

```bash
# Na EC2
docker load -i /home/ubuntu/projeto/backend.tar
docker compose -f /home/ubuntu/projeto/docker-compose.prod.yml up -d --force-recreate backend
```

## Verificar Status na EC2

```bash
# Ver containers rodando
docker compose -f /home/ubuntu/projeto/docker-compose.prod.yml ps

# Ver logs
docker compose -f /home/ubuntu/projeto/docker-compose.prod.yml logs -f

# Ver logs de um serviço específico
docker compose -f /home/ubuntu/projeto/docker-compose.prod.yml logs -f backend
```

## Troubleshooting

### Erro: "port is already allocated"
```bash
docker compose -f /home/ubuntu/projeto/docker-compose.prod.yml down
bash 3_load_and_up.sh
```

### Erro: "Bad permissions" no .pem
```powershell
icacls "C:\caminho\chave.pem" /inheritance:r
icacls "C:\caminho\chave.pem" /remove *S-1-5-11
icacls "C:\caminho\chave.pem" /remove *S-1-5-32-545
icacls "C:\caminho\chave.pem" /grant "$env:USERNAME`:R"
```

### Erro: "Connection timed out" no SCP
- Verifique se a porta 22 está liberada no Security Group para o seu IP

### Database connection failed
- Se o banco está no host da EC2, use `host.docker.internal` com `extra_hosts`:
```yaml
services:
  backend:
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      DATABASE_URL: postgresql://user:pass@host.docker.internal:5432/db
```

## Vantagens deste Fluxo

- **Sem build na EC2** → evita problemas de acesso a Docker Hub
- **Independente de rede** → imagens chegam prontas via SCP
- **Reutilizável** → funciona para qualquer projeto Docker
- **Controlado** → build local, testes antes de enviar
