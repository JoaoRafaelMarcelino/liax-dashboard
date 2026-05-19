#!/usr/bin/env python3
"""
Aplicação Flask Dashboard ClickUp
Estrutura MVC para gerenciar múltiplos projetos com templates diferentes
"""

import os
import json
from flask import Flask, render_template, jsonify, request, Response
import requests
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import threading
import time
import queue
from datetime import datetime, timedelta, timezone

app = Flask(__name__)

# Configurações
CLICKUP_TOKEN = os.environ.get("CLICKUP_TOKEN", "pk_78841674_UDO4MG6XRKSWRWLKJW0TMTHOO4B0A4K7")
ENABLE_AUTO_RELOAD = os.environ.get("ENABLE_AUTO_RELOAD", "false").lower() == "true"
CACHE_DIR = "cache"
CACHE_EXPIRY_MINUTES = 30


class ConfigManager:
    """Gerencia configurações de projetos."""
    
    def __init__(self):
        self.config_file = 'projects.json'
        # Criar diretório de cache se não existir
        if not os.path.exists(CACHE_DIR):
            os.makedirs(CACHE_DIR)
    
    def load_projects(self):
        """Carrega a configuração dos projetos do arquivo JSON."""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return {"projects": []}
    
    def get_project_by_id(self, project_id):
        """Retorna um projeto específico pelo ID."""
        config = self.load_projects()
        for project in config.get('projects', []):
            if project.get('id') == project_id:
                return project
        return None
    
    def get_project_by_url(self, url):
        """Retorna um projeto específico pela URL."""
        config = self.load_projects()
        for project in config.get('projects', []):
            if project.get('url') == url:
                return project
        return None


class CacheManager:
    """Gerencia cache de tarefas."""
    
    def __init__(self):
        if not os.path.exists(CACHE_DIR):
            os.makedirs(CACHE_DIR)
    
    def get_cache_filename(self, url):
        """Gera nome de arquivo de cache baseado na URL."""
        import hashlib
        url_hash = hashlib.md5(url.encode()).hexdigest()
        return os.path.join(CACHE_DIR, f"tasks_{url_hash}.json")
    
    def get_cached_tasks(self, url):
        """Retorna tarefas do cache sempre que existir, com informação de quando foi cacheado."""
        cache_file = self.get_cache_filename(url)
        try:
            if os.path.exists(cache_file):
                with open(cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Sempre retorna o cache se existir, sem verificar expiry
                cached_at_str = data.get('cached_at', '')
                if cached_at_str:
                    # Adicionar 'Z' se não tiver timezone para tratar como UTC
                    if cached_at_str and not cached_at_str.endswith('Z') and '+' not in cached_at_str:
                        cached_at_str += 'Z'
                    cached_at = datetime.fromisoformat(cached_at_str.replace('Z', '+00:00'))
                else:
                    cached_at = datetime.now(timezone.utc)
                return {
                    'tasks': data.get('tasks', []),
                    'cached_at': cached_at.isoformat()
                }
        except Exception as e:
            print(f"Erro ao ler cache: {e}")
        
        return None
    
    def save_tasks_to_cache(self, url, tasks):
        """Salva tarefas no cache com backup."""
        cache_file = self.get_cache_filename(url)
        backup_file = cache_file + '.backup'
        
        try:
            # Se existe um cache atual, renomeia para backup
            if os.path.exists(cache_file):
                try:
                    os.rename(cache_file, backup_file)
                    print(f"   📦 Backup criado: {backup_file}")
                except Exception as backup_error:
                    print(f"   ⚠️  Aviso: Não foi possível criar backup: {backup_error}")
            
            # Salva o novo cache com timestamp em UTC
            data = {
                'cached_at': datetime.now(timezone.utc).isoformat(),
                'tasks': tasks
            }
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(data, f)
            print(f"   💾 Cache salvo: {len(tasks)} tarefas")
            
            # Se o novo cache foi salvo com sucesso, remove o backup
            if os.path.exists(backup_file):
                os.remove(backup_file)
                print(f"   🗑️  Backup removido")
                
        except Exception as e:
            print(f"   ❌ Erro ao salvar cache: {e}")
            # Se houve erro ao salvar novo cache, tenta restaurar o backup
            if os.path.exists(backup_file):
                try:
                    os.rename(backup_file, cache_file)
                    print(f"   🔄 Backup restaurado")
                except Exception as restore_error:
                    print(f"   ❌ Erro ao restaurar backup: {restore_error}")


class ClickUpAPI:
    """Cliente para a API do ClickUp."""
    
    def __init__(self, token):
        self.token = token
        self.headers = {
            "Authorization": token,
            "Content-Type": "application/json"
        }
    
    def fetch_tasks(self, url, progress_callback=None, cache_manager=None, force_refresh=False):
        """Busca todas as tarefas de uma lista específica com paginação."""
        # Sempre tenta carregar do cache primeiro, a menos que force_refresh seja true
        if cache_manager and not force_refresh:
            cached_data = cache_manager.get_cached_tasks(url)
            if cached_data:
                cached_tasks = cached_data['tasks']
                cached_at = cached_data['cached_at']
                print(f"   📦 Carregando do cache: {len(cached_tasks)} tarefas")
                return {"success": True, "tasks": cached_tasks, "from_cache": True, "cached_at": cached_at}
        
        all_tasks = []
        page = 0
        
        while True:
            try:
                # Adiciona parâmetro de paginação
                paginated_url = f"{url}?include_closed=true&page={page}"
                response = requests.get(paginated_url, headers=self.headers)
                
                if response.status_code == 200:
                    data = response.json()
                    tasks = data.get("tasks", [])
                    
                    # Se não houver tarefas, chegamos ao fim
                    if not tasks:
                        break
                    
                    all_tasks.extend(tasks)
                    
                    # Envia progresso se houver callback
                    if progress_callback:
                        progress_callback(page, len(tasks), len(all_tasks))
                    
                    # Se recebemos menos de 100 tarefas, chegamos ao fim
                    if len(tasks) < 100:
                        break
                    
                    page += 1
                else:
                    return {"success": False, "error": f"Erro {response.status_code}: {response.text}"}
                    
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        # Salva no cache se houver cache_manager
        if cache_manager and all_tasks:
            cache_manager.save_tasks_to_cache(url, all_tasks)
        
        return {"success": True, "tasks": all_tasks, "from_cache": False}


class ReloadHandler(FileSystemEventHandler):
    """Handler para detectar mudanças em arquivos e recarregar o servidor."""
    
    def __init__(self):
        self.last_reload = time.time()
        self.reload_delay = 1  # segundos entre recarregamentos
    
    def on_modified(self, event):
        """Detecta modificações em arquivos."""
        if event.is_directory:
            return
        
        if event.src_path.endswith('.pyc') or '__pycache__' in event.src_path:
            return
        
        current_time = time.time()
        if current_time - self.last_reload < self.reload_delay:
            return
        
        self.last_reload = current_time
        print(f"\n🔄 Arquivo modificado: {event.src_path}")
        print("   Recarregando servidor...")


# Instâncias
config_manager = ConfigManager()
cache_manager = CacheManager()
clickup_api = ClickUpAPI(CLICKUP_TOKEN)


@app.route('/')
def dashboard():
    """Rota principal que serve o dashboard."""
    try:
        projects = config_manager.load_projects().get('projects', [])
        # Usa o template do primeiro projeto como padrão
        template_name = projects[0].get('template', 'dashboard_lello.html') if projects else 'dashboard_lello.html'
        return render_template(template_name, 
                              token=CLICKUP_TOKEN,
                              projects=projects)
    except Exception as e:
        return render_template('error.html', error=str(e)), 500


@app.route('/api/tasks')
def get_tasks():
    """API endpoint para buscar tarefas do ClickUp."""
    project_url = request.args.get('project_url')
    force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
    
    if not project_url:
        projects = config_manager.load_projects().get('projects', [])
        if projects:
            project_url = projects[0].get('url')
    
    if not project_url:
        return jsonify({"success": False, "error": "Nenhum projeto especificado"}), 400
    
    # Se for forçar refresh, não deleta o cache imediatamente
    # O cache será atualizado apenas após sucesso da busca
    
    result = clickup_api.fetch_tasks(project_url, cache_manager=cache_manager, force_refresh=force_refresh)
    return jsonify(result)


@app.route('/api/tasks/stream')
def get_tasks_stream():
    """API endpoint SSE para buscar tarefas com progresso em tempo real."""
    project_url = request.args.get('project_url')
    force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
    
    if not project_url:
        projects = config_manager.load_projects().get('projects', [])
        if projects:
            project_url = projects[0].get('url')
    
    if not project_url:
        def error():
            yield f"data: {json.dumps({'success': False, 'error': 'Nenhum projeto especificado'})}\n\n"
        return Response(error(), mimetype='text/event-stream')
    
    # Se for forçar refresh, não deleta o cache imediatamente
    # O cache será atualizado apenas após sucesso da busca
    
    def generate():
        progress_queue = queue.Queue()
        
        def progress_callback(page, tasks_on_page, total_tasks):
            progress_queue.put({
                'type': 'progress',
                'page': page,
                'tasks_on_page': tasks_on_page,
                'total_tasks': total_tasks
            })
        
        # Inicia a busca em uma thread separada
        def fetch_in_thread():
            result = clickup_api.fetch_tasks(project_url, progress_callback, cache_manager=cache_manager, force_refresh=force_refresh)
            progress_queue.put({
                'type': 'complete',
                'result': result
            })
        
        thread = threading.Thread(target=fetch_in_thread)
        thread.start()
        
        while True:
            try:
                message = progress_queue.get(timeout=30)
                yield f"data: {json.dumps(message)}\n\n"
                
                if message['type'] == 'complete':
                    break
            except queue.Empty:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Timeout'})}\n\n"
                break
    
    return Response(generate(), mimetype='text/event-stream')


def start_file_watcher():
    """Inicia o monitoramento de arquivos para auto-reload."""
    event_handler = ReloadHandler()
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=True)
    observer.start()
    print("📂 Monitoramento de arquivos ativado (auto-reload)")
    print("   Modifique qualquer arquivo .py ou .html para recarregar\n")
    return observer


if __name__ == "__main__":
    print("=" * 60)
    print("Dashboard ClickUp - MVC Structure")
    print("=" * 60)
    
    observer = None
    
    if ENABLE_AUTO_RELOAD:
        print("\n🚀 Iniciando servidor com auto-reload...")
        observer = start_file_watcher()
    else:
        print("\n🚀 Iniciando servidor (auto-reload desativado)...")
    
    print("\n🌐 Acesse: http://localhost:5000")
    print("⏹️  Pressione Ctrl+C para parar o servidor\n")
    
    try:
        app.run(
            host='0.0.0.0', 
            port=5000, 
            debug=ENABLE_AUTO_RELOAD, 
            use_reloader=ENABLE_AUTO_RELOAD
        )
    except KeyboardInterrupt:
        print("\n\n⏹️  Parando servidor...")
        if observer:
            observer.stop()
            observer.join()
        print("✅ Servidor parado com sucesso")
