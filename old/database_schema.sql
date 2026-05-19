-- Estrutura de Banco de Dados Relacional para ClickUp Tasks
-- Baseado na estrutura JSON do cache

-- Tabela principal de projetos/lists
CREATE TABLE projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL UNIQUE,
    hidden BOOLEAN DEFAULT FALSE,
    access BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de espaços (spaces)
CREATE TABLE spaces (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Tabela de pastas (folders)
CREATE TABLE folders (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    space_id VARCHAR(50),
    name VARCHAR(255),
    hidden BOOLEAN DEFAULT FALSE,
    access BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE SET NULL
);

-- Tabela de listas
CREATE TABLE lists (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    folder_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    access BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

-- Tabela de usuários
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    color VARCHAR(7),
    initials VARCHAR(10),
    profile_picture VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de status
CREATE TABLE statuses (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7),
    type VARCHAR(50),
    orderindex INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de prioridades
CREATE TABLE priorities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7),
    orderindex INT
);

-- Tabela de tags
CREATE TABLE tags (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela principal de tarefas
CREATE TABLE tasks (
    id VARCHAR(50) PRIMARY KEY,
    list_id VARCHAR(50) NOT NULL,
    custom_id VARCHAR(50),
    custom_item_id INT,
    name VARCHAR(500) NOT NULL,
    text_content TEXT,
    description TEXT,
    status_id VARCHAR(50),
    priority_id VARCHAR(50),
    orderindex DECIMAL(30, 15),
    date_created BIGINT,
    date_updated BIGINT,
    date_closed BIGINT,
    date_done BIGINT,
    due_date BIGINT,
    start_date BIGINT,
    archived BOOLEAN DEFAULT FALSE,
    team_id VARCHAR(50),
    url VARCHAR(500),
    permission_level VARCHAR(50),
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL,
    FOREIGN KEY (priority_id) REFERENCES priorities(id) ON DELETE SET NULL
);

-- Tabela de criadores de tarefas
CREATE TABLE task_creators (
    task_id VARCHAR(50) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de assignees (responsáveis) das tarefas
CREATE TABLE task_assignees (
    task_id VARCHAR(50),
    user_id BIGINT,
    PRIMARY KEY (task_id, user_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de watchers (observadores) das tarefas
CREATE TABLE task_watchers (
    task_id VARCHAR(50),
    user_id BIGINT,
    PRIMARY KEY (task_id, user_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de checklists
CREATE TABLE checklists (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Tabela de itens de checklist
CREATE TABLE checklist_items (
    id VARCHAR(50) PRIMARY KEY,
    checklist_id VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    completed BOOLEAN DEFAULT FALSE,
    orderindex INT,
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);

-- Tabela de tags das tarefas
CREATE TABLE task_tags (
    task_id VARCHAR(50),
    tag_id VARCHAR(50),
    PRIMARY KEY (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Tabela de tipos de campos personalizados
CREATE TABLE custom_field_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Tabela de campos personalizados
CREATE TABLE custom_fields (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type_id VARCHAR(50) NOT NULL,
    type_config JSON,
    required BOOLEAN DEFAULT FALSE,
    hide_from_guests BOOLEAN DEFAULT FALSE,
    date_created BIGINT,
    FOREIGN KEY (type_id) REFERENCES custom_field_types(id)
);

-- Tabela de opções para campos personalizados (dropdown, etc)
CREATE TABLE custom_field_options (
    id VARCHAR(100) PRIMARY KEY,
    custom_field_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7),
    orderindex INT,
    FOREIGN KEY (custom_field_id) REFERENCES custom_fields(id) ON DELETE CASCADE
);

-- Tabela de valores de campos personalizados das tarefas
CREATE TABLE task_custom_fields (
    task_id VARCHAR(50),
    custom_field_id VARCHAR(100),
    value TEXT,
    value_index INT,
    PRIMARY KEY (task_id, custom_field_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (custom_field_id) REFERENCES custom_fields(id) ON DELETE CASCADE
);

-- Tabela de dependências de tarefas
CREATE TABLE task_dependencies (
    task_id VARCHAR(50),
    depends_on_task_id VARCHAR(50),
    PRIMARY KEY (task_id, depends_on_task_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Tabela de tarefas vinculadas
CREATE TABLE linked_tasks (
    task_id VARCHAR(50),
    linked_task_id VARCHAR(50),
    link_id VARCHAR(50),
    user_id BIGINT,
    date_created BIGINT,
    workspace_id VARCHAR(50),
    PRIMARY KEY (task_id, linked_task_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de cache
CREATE TABLE cache (
    id VARCHAR(100) PRIMARY KEY,
    project_url VARCHAR(500) NOT NULL,
    cached_at TIMESTAMP NOT NULL,
    task_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX idx_tasks_list_id ON tasks(list_id);
CREATE INDEX idx_tasks_status_id ON tasks(status_id);
CREATE INDEX idx_tasks_custom_item_id ON tasks(custom_item_id);
CREATE INDEX idx_tasks_date_created ON tasks(date_created);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_task_assignees_user_id ON task_assignees(user_id);
CREATE INDEX idx_task_watchers_user_id ON task_watchers(user_id);
CREATE INDEX idx_task_custom_fields_custom_field_id ON task_custom_fields(custom_field_id);
CREATE INDEX idx_cache_project_url ON cache(project_url);
