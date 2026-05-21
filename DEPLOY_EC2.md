# Deploy para AWS EC2

Este documento descreve o fluxo de deploy da aplicação para a AWS EC2 usando imagens pré-buildadas localmente.

## Visão Geral

O deploy não usa build na EC2 (evita problemas de acesso ao Docker Hub). O fluxo é:
1. **Build local** → imagens Docker são criadas no seu PC
2. **Exportação** → imagens são salvas em arquivos `.tar`
3. **Envio** → arquivos `.tar` são copiados para a EC2 via SCP
4. **Load e Up** → imagens são carregadas e containers reiniciados na EC2

## Configuração Inicial (primeira vez)

### 1. Configurar chaves SSH no Windows

A chave `.pem` precisa ter permissões restritas apenas ao seu usuário:

```powershell
# Remover permissões herdadas e deixar só seu usuário
icacls "D:\aws\chave-padrao.pem" /inheritance:r
icacls "D:\aws\chave-padrao.pem" /remove *S-1-5-11
icacls "D:\aws\chave-padrao.pem" /remove *S-1-5-32-545
icacls "D:\aws\chave-padrao.pem" /grant "$env:USERNAME`:R"
```

### 2. Configurar Security Group na AWS

No Console da AWS → EC2 → Security Groups:
- Adicionar regra inbound: **SSH (22)** → Source: **My IP**

### 3. Primeiro deploy na EC2

```powershell
# No seu PC
.\scripts\1_build_and_save.ps1
.\scripts\2_send_to_ec2.ps1
```

```bash
# Na EC2
ssh -i D:\aws\chave-padrao.pem ubuntu@56.124.92.68
cd /home/ubuntu/liax

# Criar .env.prod
cp .env.prod.example .env.prod
nano .env.prod

# Preencher:
# CLICKUP_TOKEN=pk_78841674_UDO4MG6XRKSWRWLKJW0TMTHOO4B0A4K7
# SECRET_KEY=liax-dashboard-secret-key-change-in-production

# Subir containers
bash 3_load_and_up.sh
```

## Deploy de Atualizações (fluxo padrão)

Sempre que fizer alterações no código:

### Passo 1 - No seu PC

```powershell
# Rebuild das 3 imagens e salva em .tar
.\scripts\1_build_and_save.ps1

# Envia para a EC2
.\scripts\2_send_to_ec2.ps1
```

### Passo 2 - Na EC2

```bash
# Se já estiver conectado:
bash /home/ubuntu/liax/3_load_and_up.sh

# Ou se precisar conectar:
ssh -i D:\aws\chave-padrao.pem ubuntu@56.124.92.68
cd /home/ubuntu/liax
bash 3_load_and_up.sh
```

## Deploy Otimizado (só o que mudou)

Se alterou **só um serviço**, não precisa rebuildar tudo:

### Exemplo: só frontend mudou

```powershell
# No seu PC
docker build -t liax-frontend:latest ./frontend
docker save liax-frontend:latest -o scripts\liax-frontend.tar
scp -i D:\aws\chave-padrao.pem scripts\liax-frontend.tar ubuntu@56.124.92.68:/home/ubuntu/liax/
```

```bash
# Na EC2
docker load -i /home/ubuntu/liax/liax-frontend.tar
docker compose -f /home/ubuntu/liax/docker-compose.prod.yml up -d --force-recreate frontend
```

## Arquivos do Deploy

| Arquivo | Função |
|---|---|
| `scripts/1_build_and_save.ps1` | Build local + export .tar |
| `scripts/2_send_to_ec2.ps1` | SCP para EC2 |
| `scripts/3_load_and_up.sh` | Load imagens + up containers na EC2 |
| `docker-compose.prod.yml` | Compose de produção (usa `image:`) |
| `.env.prod` | Variáveis de ambiente na EC2 |

## Portas

- **Frontend**: `5003`
- **Backend**: `4002`
- **Legacy**: `5004`

## Verificar Status na EC2

```bash
# Ver containers rodando
docker compose -f /home/ubuntu/liax/docker-compose.prod.yml ps

# Ver logs
docker compose -f /home/ubuntu/liax/docker-compose.prod.yml logs -f

# Ver logs de um serviço específico
docker compose -f /home/ubuntu/liax/docker-compose.prod.yml logs -f backend
```

## Troubleshooting

### Erro: "port is already allocated"
```bash
docker compose -f /home/ubuntu/liax/docker-compose.prod.yml down
bash /home/ubuntu/liax/3_load_and_up.sh
```

### Erro: "Bad permissions" no .pem
```powershell
icacls "D:\aws\chave-padrao.pem" /inheritance:r
icacls "D:\aws\chave-padrao.pem" /remove *S-1-5-11
icacls "D:\aws\chave-padrao.pem" /remove *S-1-5-32-545
icacls "D:\aws\chave-padrao.pem" /grant "$env:USERNAME`:R"
```

### Erro: "Connection timed out" no SCP
- Verifique se a porta 22 está liberada no Security Group para o seu IP

### Erro: Database connection failed
- Verifique se o PostgreSQL está rodando na EC2: `sudo systemctl status postgresql`
- O `docker-compose.prod.yml` já está configurado com `host.docker.internal` e `extra_hosts` para acessar o banco no host
