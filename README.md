# Buscador Status ClickUp / Liax Dashboard

Aplicação web interna para acompanhar tarefas do ClickUp, consolidar indicadores de migração e visualizar a operação em painéis interativos.

O projeto atual é composto por:

- **Frontend** em React + Vite
- **Backend** em FastAPI + SQLAlchemy
- **Banco de dados** PostgreSQL
- **Execução via Docker** com ambientes separados para desenvolvimento e homologação
- **Dashboard legado** mantido no repositório para compatibilidade

## Visão geral da aplicação

A aplicação centraliza dados do ClickUp e disponibiliza diferentes áreas de análise:

- **Dashboard principal**
  - cards de resumo
  - gráficos de migração
  - distribuição por status
  - indicadores por colaborador e por programa

- **Visão Geral**
  - painel configurável por abas
  - abas definidas pelo administrador
  - suporta cards, gráficos e sessões completas embutidas

- **Planejamento Mensal**
  - compara o plano mensal com o realizado do ClickUp
  - permite alternar a visão realizada
  - permite burn-up / burn-down
  - permite visão de uma linha ou todas as linhas no gráfico
  - possui comparativo mensal clicável por mês e por programa

- **Homologação**
  - cards e listas de migrações liberadas para HML
  - aprovações em homologação
  - bugs de homologação

- **Administração de configuração**
  - configuração das abas exibidas na Visão Geral
  - seleção dos gráficos e sessões exibidas por aba

## Arquitetura

### Frontend

Localizado em `frontend/`.

Tecnologias principais:

- React 18
- Vite
- React Router
- Tailwind CSS
- Chart.js / react-chartjs-2
- Lucide React para ícones

Responsabilidades:

- autenticação e navegação das telas
- exibição dos painéis e modais
- gráficos e comparativos
- configuração da Visão Geral

### Backend

Localizado em `backend/`.

Tecnologias principais:

- FastAPI
- SQLAlchemy
- PostgreSQL
- APScheduler
- Pydantic Settings
- HTTPX

Responsabilidades:

- expor APIs para o frontend
- persistir e consultar dados no PostgreSQL
- sincronizar tarefas com o ClickUp
- calcular métricas e agregações para o dashboard
- manter configurações administrativas

### Banco de dados

O backend lê a variável `DATABASE_URL` e cria a conexão com PostgreSQL.

O app sobe as tabelas com `Base.metadata.create_all(...)` na inicialização.

## Principais módulos do backend

- `backend/app/main.py`
  - ponto de entrada da API FastAPI
  - registra routers e inicializa o scheduler

- `backend/app/config.py`
  - carrega `DATABASE_URL`, `SECRET_KEY` e `CLICKUP_TOKEN`

- `backend/app/database.py`
  - cria engine, `SessionLocal` e `get_db`

- `backend/app/routers/dashboard.py`
  - endpoints de métricas, gráficos e comparativos

- `backend/app/routers/sync.py`
  - configuração da sincronização e reprocessamento de jobs

- `backend/app/services/clickup_service.py`
  - integração com a API do ClickUp

- `backend/app/services/sync_scheduler.py`
  - agendamento das sincronizações automáticas

## Ambientes

### Desenvolvimento

É o ambiente padrão do repositório.

Arquivos usados:

- `docker-compose.yml`
- `.env.example`
- `docker-compose.override.yml`

Banco de dados:

- `postgresql://admin:1i4x%40Liax@host.docker.internal:5432/dashboard`

### Homologação

Arquivo dedicado:

- `docker-compose.homolog.yml`

Arquivo de variáveis:

- `.env.homolog`

Banco de dados:

- `postgresql://admin:1i4x%40Liax@56.124.92.68:5432/meu-database`

## Variáveis de ambiente

### Desenvolvimento

Crie um `.env` local com base em `.env.example`.

Exemplo:

```env
DATABASE_URL=postgresql://admin:1i4x%40Liax@host.docker.internal:5432/dashboard
CLICKUP_TOKEN=seu_token_clickup
SECRET_KEY=uma_chave_secreta_segura
```

### Homologação

Use o arquivo `.env.homolog`.

Conteúdo esperado:

```env
DATABASE_URL=postgresql://admin:1i4x%40Liax@56.124.92.68:5432/meu-database
CLICKUP_TOKEN=seu_token_clickup
SECRET_KEY=uma_chave_secreta_segura
```

## Como executar

### Desenvolvimento

```bash
docker-compose up --build -d
```

Serviços expostos:

- Frontend: `http://localhost:5001`
- Backend: `http://localhost:4001`
- API docs: `http://localhost:4001/api/docs`

### Homologação

```bash
docker-compose -f docker-compose.homolog.yml up --build -d
```

Serviços expostos:

- Frontend: `http://localhost:5003`
- Backend: `http://localhost:4002`

## Docker

### Arquivos principais

- `docker-compose.yml`
  - ambiente de desenvolvimento

- `docker-compose.override.yml`
  - reforça as definições do ambiente local

- `docker-compose.homolog.yml`
  - ambiente de homologação

### Comandos úteis

```bash
docker-compose logs -f
docker-compose down
docker-compose up --build -d
docker-compose -f docker-compose.homolog.yml logs -f
docker-compose -f docker-compose.homolog.yml down
```

## Sincronização com ClickUp

O backend consulta o ClickUp para consolidar as informações do dashboard.

Há um scheduler em segundo plano que registra jobs com base nas configurações ativas de sincronização.

## Funcionalidades principais

- visão consolidada de tarefas, bugs e melhorias
- gráficos de tendência por semana
- distribuição de status
- métricas por colaborador
- comparativo mensal com plano x realizado
- modais detalhados de mês, programa e tarefa
- painel executivo configurável na Visão Geral

## Observações importantes

- O backend depende de `DATABASE_URL`, `CLICKUP_TOKEN` e `SECRET_KEY`.
- A configuração da Visão Geral é gerenciada pelo administrador.
- O dashboard legado foi mantido no repositório para compatibilidade.
- O frontend atual foi construído para operar com os dados consolidados do backend FastAPI.

## Estrutura resumida do repositório

```text
backend/                API FastAPI, models, routers, services e scheduler
frontend/               Interface React/Vite/Tailwind
old/                    Dashboard legado
docker-compose.yml      Ambiente de desenvolvimento
docker-compose.homolog.yml  Ambiente de homologação
.env.example            Exemplo de variáveis de desenvolvimento
.env.homolog            Variáveis de homologação
```

## Sugestão de branch Git

Nome sugerido:

```bash
feature/docs-ambientes-readme
```

Descrição sugerida:

```text
Documenta a aplicação, separa ambientes de desenvolvimento e homologação, e atualiza o README com a arquitetura, execução e contexto do dashboard.
```
