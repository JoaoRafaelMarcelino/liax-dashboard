-- ============================================================
-- LIAX DASHBOARD - Schema Inicial
-- Execute: psql -U admin -d dashboard -f 001_initial.sql
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- AUTENTICAÇÃO E USUÁRIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL  -- 'admin' | 'viewer'
);

INSERT INTO user_roles (name) VALUES ('admin'), ('viewer') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role_id INTEGER NOT NULL REFERENCES user_roles(id) DEFAULT 2,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin padrão (senha: 1i4x@Mudar)
INSERT INTO users (email, password_hash, full_name, role_id, must_change_password)
VALUES (
    'admin@liax.tech',
    crypt('1i4x@Mudar', gen_salt('bf')),
    'Administrador',
    1,
    FALSE
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- CONFIGURAÇÃO DE SINCRONIZAÇÃO CLICKUP
-- ============================================================

CREATE TABLE IF NOT EXISTS sync_config (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    clickup_list_url VARCHAR(500) NOT NULL UNIQUE,
    clickup_token VARCHAR(255) NOT NULL,
    sync_interval_minutes INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAREFAS (ESTRUTURA NORMALIZADA DO CLICKUP)
-- ============================================================

CREATE TABLE IF NOT EXISTS clickup_lists (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(500),
    sync_config_id INTEGER REFERENCES sync_config(id)
);

CREATE TABLE IF NOT EXISTS clickup_statuses (
    id VARCHAR(100) PRIMARY KEY,
    status VARCHAR(255) NOT NULL,
    color VARCHAR(50),
    type VARCHAR(50),
    orderindex INTEGER
);

CREATE TABLE IF NOT EXISTS clickup_users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255),
    color VARCHAR(50),
    profile_picture TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(100) PRIMARY KEY,
    custom_id VARCHAR(100),
    custom_item_id INTEGER,           -- 0=migração, 1004=bug, 1005=melhoria
    name TEXT NOT NULL,
    text_content TEXT,
    status_id VARCHAR(100) REFERENCES clickup_statuses(id),
    status_name VARCHAR(255),
    status_color VARCHAR(50),
    status_type VARCHAR(50),
    status_orderindex INTEGER,
    priority VARCHAR(50),
    date_created TIMESTAMPTZ,
    date_updated TIMESTAMPTZ,
    date_closed TIMESTAMPTZ,
    date_done TIMESTAMPTZ,
    archived BOOLEAN DEFAULT FALSE,
    creator_id BIGINT REFERENCES clickup_users(id),
    list_id VARCHAR(100) REFERENCES clickup_lists(id),
    orderindex TEXT,

    -- Custom fields relevantes
    programa VARCHAR(500),
    lote VARCHAR(255),
    prioridade_custom VARCHAR(100),
    desenv_back_finalizado TIMESTAMPTZ,
    desenv_front_finalizado TIMESTAMPTZ,
    inicio_qa TIMESTAMPTZ,
    fim_qa TIMESTAMPTZ,
    inicio_homologacao TIMESTAMPTZ,
    bugs_em_aberto INTEGER DEFAULT 0,
    bugs_totais INTEGER DEFAULT 0,
    previsao_entrega TIMESTAMPTZ,
    observacoes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_assignees (
    task_id VARCHAR(100) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES clickup_users(id),
    PRIMARY KEY (task_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_watchers (
    task_id VARCHAR(100) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES clickup_users(id),
    PRIMARY KEY (task_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_dev_back (
    task_id VARCHAR(100) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES clickup_users(id),
    PRIMARY KEY (task_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_dev_front (
    task_id VARCHAR(100) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES clickup_users(id),
    PRIMARY KEY (task_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_tags (
    task_id VARCHAR(100) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL,
    PRIMARY KEY (task_id, tag)
);

CREATE TABLE IF NOT EXISTS task_custom_fields_raw (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(100) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    field_id VARCHAR(100) NOT NULL,
    field_name VARCHAR(255),
    field_type VARCHAR(100),
    value_text TEXT,
    value_number NUMERIC,
    value_date TIMESTAMPTZ,
    value_json JSONB,
    UNIQUE (task_id, field_id)
);

-- ============================================================
-- LOG DE SINCRONIZAÇÃO
-- ============================================================

CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    sync_config_id INTEGER REFERENCES sync_config(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    tasks_synced INTEGER DEFAULT 0,
    tasks_created INTEGER DEFAULT 0,
    tasks_updated INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'running',  -- running | success | error
    error_message TEXT
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tasks_custom_item_id ON tasks(custom_item_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status_name ON tasks(status_name);
CREATE INDEX IF NOT EXISTS idx_tasks_date_created ON tasks(date_created);
CREATE INDEX IF NOT EXISTS idx_tasks_date_done ON tasks(date_done);
CREATE INDEX IF NOT EXISTS idx_tasks_date_updated ON tasks(date_updated);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_task_custom_fields_task ON task_custom_fields_raw(task_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
