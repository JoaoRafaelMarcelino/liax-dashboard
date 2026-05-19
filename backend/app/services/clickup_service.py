import re
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.task import Task, ClickupUser, ClickupStatus, ClickupList, TaskAssignee, TaskDevBack, TaskDevFront, TaskQA, TaskReteste, TaskTag, TaskCustomFieldRaw
from ..models.sync_config import SyncConfig, SyncLog

# Mapeamento de IDs de campos personalizados conhecidos
CUSTOM_FIELD_MAP = {
    "6b432101-9e60-420e-82eb-859b17141d5d": "desenv_back_finalizado",
    "bce2f37a-2543-44f1-a843-7c64359a3248": "desenv_front_finalizado",
    "4853b64a-f152-40a7-8b3c-2a44be3486de": "dev_back_users",
    "5123a0d2-86c2-4ae1-8437-ffa093576dbb": "dev_front_users",
    "8efc41b3-ff05-4939-a7d7-50bc3000470d": "qa_users",
    "cd507266-08a5-4f5b-a023-ac4f90f8eac1": "reteste_users",
    "26539da3-1e52-4ecd-9d61-a88d7d747b16": "qa_inicio",
    "d0d849c9-1e62-4c49-8c52-9d02887b0fd2": "qa_finalizado",
    "c0b41c75-b135-4bb7-aa9f-588187d4bf58": "reteste_inicio",
    "ac1cb7a2-59fe-41aa-b07d-3086fa93682c": "reteste_finalizado",
    "63d99c5a-51ae-4ee2-a9cd-9e6878934e62": "bugs_em_aberto",
    "4d3c26a5-4e09-403b-a0d6-26bdf286c013": "bugs_totais",
    "67d33bf2-ed75-4164-baaf-5318e883d137": "quantidade_linhas",
    "90b50000-51a5-4337-b412-0098005978fb": "ordem_atendimento",
    "fc4d3a75-f523-43ba-bb32-9258a723a07e": "programa",
    "b60375b2-a22a-4a31-a99e-cd430aedefab": "lote",
    "2abcbb94-611c-414c-85fe-6688f706dfa6": "reaberto",
    "67db9e6f-e73a-4f76-9195-b81a5a57e728": "prioridade_custom",
    "2f74849b-78da-4a71-aceb-5dc70328747d": "liberacao_hml_lello",
    "a0f3c435-db74-4b78-8e6d-f0a242d65251": "aprovacao_hml_lello",
    "770857b7-31be-4003-a6c8-eaa6af553a38": "aprovacao_prod_lello",
    "1c3b583b-d3ba-4baa-846e-aec96a396ecf": "aplicacao_producao",
    "44264d66-2f94-4585-8b2b-6cf2ee9a7330": "desenv_back_inicio",
    "de7c1c4e-48d0-4513-9649-09e62f42295c": "desenv_front_inicio",
    "d5189a22-1635-44c5-85f0-c33b87cf25b4": "motivo_block",
}


def _fetch_dropdown_options(list_url: str, token: str) -> Dict[str, Dict[int, str]]:
    """Retorna {field_id: {orderindex: option_name}} para campos dropdown da lista."""
    m = re.search(r"/list/(\d+)/", list_url)
    if not m:
        return {}
    list_id = m.group(1)
    try:
        resp = httpx.get(
            f"https://api.clickup.com/api/v2/list/{list_id}/field",
            headers={"Authorization": token},
            timeout=30,
        )
        if resp.status_code != 200:
            return {}
        result = {}
        for f in resp.json().get("fields", []):
            if f.get("type") == "drop_down":
                opts = f.get("type_config", {}).get("options", [])
                result[f["id"]] = {opt["orderindex"]: opt["name"] for opt in opts}
        return result
    except Exception:
        return {}


def _ts_to_dt(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        return datetime.fromtimestamp(int(ts) / 1000, tz=timezone.utc)
    except Exception:
        return None


def _upsert_clickup_user(db: Session, user_data: dict, _cache: dict) -> Optional[ClickupUser]:
    if not user_data or not user_data.get("id"):
        return None
    uid = user_data["id"]
    if uid in _cache:
        return _cache[uid]
    user = db.get(ClickupUser, uid)
    if not user:
        user = ClickupUser(
            id=uid,
            username=user_data.get("username"),
            email=user_data.get("email"),
            color=user_data.get("color"),
            profile_picture=user_data.get("profilePicture"),
        )
        db.add(user)
    else:
        user.username = user_data.get("username", user.username)
        user.email = user_data.get("email", user.email)
    _cache[uid] = user
    return user


def _upsert_status(db: Session, status_data: dict, _cache: dict) -> Optional[ClickupStatus]:
    if not status_data or not status_data.get("id"):
        return None
    sid = status_data["id"]
    if sid in _cache:
        return _cache[sid]
    status = db.get(ClickupStatus, sid)
    if not status:
        status = ClickupStatus(
            id=sid,
            status=status_data.get("status", ""),
            color=status_data.get("color"),
            type=status_data.get("type"),
            orderindex=status_data.get("orderindex"),
        )
        db.add(status)
    _cache[sid] = status
    return status


def sync_tasks(db: Session, config: SyncConfig) -> SyncLog:
    log = SyncLog(sync_config_id=config.id, status="running")
    db.add(log)
    db.commit()

    headers = {"Authorization": config.clickup_token, "Content-Type": "application/json"}
    all_tasks = []
    page = 0

    try:
        while True:
            url = f"{config.clickup_list_url}?include_closed=true&page={page}"
            response = httpx.get(url, headers=headers, timeout=60)
            if response.status_code != 200:
                raise Exception(f"API erro {response.status_code}: {response.text}")
            data = response.json()
            tasks = data.get("tasks", [])
            if not tasks:
                break
            all_tasks.extend(tasks)
            if len(tasks) < 100:
                break
            page += 1

        created = updated = 0
        user_cache: Dict[int, ClickupUser] = {}
        status_cache: Dict[str, ClickupStatus] = {}
        dropdown_opts = _fetch_dropdown_options(config.clickup_list_url, config.clickup_token)

        # Ensure list exists
        list_id_str = str(config.id)
        ck_list = db.get(ClickupList, list_id_str)
        if not ck_list:
            ck_list = ClickupList(id=list_id_str, name=config.project_name, sync_config_id=config.id)
            db.add(ck_list)

        for raw in all_tasks:
            task_id = raw.get("id")
            if not task_id:
                continue

            # Status
            status_data = raw.get("status", {})
            _upsert_status(db, status_data, status_cache)

            # Creator
            if raw.get("creator"):
                _upsert_clickup_user(db, raw["creator"], user_cache)

            # Assignees (deduplicated)
            assignee_ids = []
            seen_assignees = set()
            for a in raw.get("assignees", []):
                _upsert_clickup_user(db, a, user_cache)
                if a["id"] not in seen_assignees:
                    assignee_ids.append(a["id"])
                    seen_assignees.add(a["id"])

            db.flush()

            # Parse custom fields
            cf_data: Dict[str, Any] = {}
            dev_back_users = []
            dev_front_users = []
            qa_users = []
            reteste_users = []

            for cf in raw.get("custom_fields", []):
                cf_id = cf.get("id")
                cf_name = CUSTOM_FIELD_MAP.get(cf_id)
                val = cf.get("value")

                if cf_name == "dev_back_users" and val:
                    for u in (val if isinstance(val, list) else []):
                        _upsert_clickup_user(db, u, user_cache)
                        uid = u.get("id")
                        if uid and uid not in dev_back_users:
                            dev_back_users.append(uid)
                elif cf_name == "dev_front_users" and val:
                    for u in (val if isinstance(val, list) else []):
                        _upsert_clickup_user(db, u, user_cache)
                        uid = u.get("id")
                        if uid and uid not in dev_front_users:
                            dev_front_users.append(uid)
                elif cf_name == "qa_users" and val:
                    for u in (val if isinstance(val, list) else []):
                        _upsert_clickup_user(db, u, user_cache)
                        uid = u.get("id")
                        if uid and uid not in qa_users:
                            qa_users.append(uid)
                elif cf_name == "reteste_users" and val:
                    for u in (val if isinstance(val, list) else []):
                        _upsert_clickup_user(db, u, user_cache)
                        uid = u.get("id")
                        if uid and uid not in reteste_users:
                            reteste_users.append(uid)
                elif cf_name in (
                    "desenv_back_inicio", "desenv_back_finalizado",
                    "desenv_front_inicio", "desenv_front_finalizado",
                    "liberacao_hml_lello", "aprovacao_hml_lello",
                    "aprovacao_prod_lello", "aplicacao_producao",
                    "qa_inicio", "qa_finalizado",
                    "reteste_inicio", "reteste_finalizado",
                ) and val:
                    cf_data[cf_name] = _ts_to_dt(str(val))
                elif cf_name in ("bugs_em_aberto", "bugs_totais", "quantidade_linhas", "ordem_atendimento") and val is not None:
                    try:
                        cf_data[cf_name] = int(val)
                    except Exception:
                        pass
                elif cf_name in ("programa", "lote", "reaberto") and val is not None:
                    opts = dropdown_opts.get(cf_id, {})
                    cf_data[cf_name] = opts.get(int(val)) if opts else str(val)
                elif cf_name == "motivo_block" and val is not None:
                    cf_data[cf_name] = str(val)
                elif cf_name == "prioridade_custom" and val is not None:
                    try:
                        cf_data[cf_name] = str(int(val))
                    except Exception:
                        pass

            # Task upsert
            existing = db.get(Task, task_id)
            if existing:
                updated += 1
                task = existing
            else:
                created += 1
                task = Task(id=task_id)
                db.add(task)

            task.custom_item_id = raw.get("custom_item_id")
            task.name = raw.get("name", "")
            task.text_content = raw.get("text_content", "")
            task.status_id = status_data.get("id")
            task.status_name = status_data.get("status")
            task.status_color = status_data.get("color")
            task.status_type = status_data.get("type")
            task.status_orderindex = status_data.get("orderindex")
            task.priority = raw.get("priority", {}).get("priority") if raw.get("priority") else None
            task.date_created = _ts_to_dt(raw.get("date_created"))
            task.date_updated = _ts_to_dt(raw.get("date_updated"))
            task.date_closed = _ts_to_dt(raw.get("date_closed"))
            task.date_done = _ts_to_dt(raw.get("date_done"))
            task.archived = raw.get("archived", False)
            task.creator_id = raw.get("creator", {}).get("id")
            task.list_id = str(config.id)
            task.orderindex = raw.get("orderindex")
            task.desenv_back_inicio = cf_data.get("desenv_back_inicio")
            task.desenv_back_finalizado = cf_data.get("desenv_back_finalizado")
            task.desenv_front_inicio = cf_data.get("desenv_front_inicio")
            task.desenv_front_finalizado = cf_data.get("desenv_front_finalizado")
            task.bugs_em_aberto = cf_data.get("bugs_em_aberto", 0)
            task.bugs_totais = cf_data.get("bugs_totais", 0)
            task.quantidade_linhas = cf_data.get("quantidade_linhas")
            task.ordem_atendimento = cf_data.get("ordem_atendimento")
            task.programa = cf_data.get("programa")
            task.lote = cf_data.get("lote")
            task.reaberto = cf_data.get("reaberto")
            task.motivo_block = cf_data.get("motivo_block")
            task.prioridade_custom = cf_data.get("prioridade_custom")
            task.liberacao_hml_lello = cf_data.get("liberacao_hml_lello")
            task.aprovacao_hml_lello = cf_data.get("aprovacao_hml_lello")
            task.aprovacao_prod_lello = cf_data.get("aprovacao_prod_lello")
            task.aplicacao_producao = cf_data.get("aplicacao_producao")
            task.qa_inicio = cf_data.get("qa_inicio")
            task.qa_finalizado = cf_data.get("qa_finalizado")
            task.reteste_inicio = cf_data.get("reteste_inicio")
            task.reteste_finalizado = cf_data.get("reteste_finalizado")

            db.flush()

            # Assignees
            db.query(TaskAssignee).filter(TaskAssignee.task_id == task_id).delete()
            for uid in assignee_ids:
                db.add(TaskAssignee(task_id=task_id, user_id=uid))

            # Dev back
            db.query(TaskDevBack).filter(TaskDevBack.task_id == task_id).delete()
            for uid in dev_back_users:
                if uid:
                    db.add(TaskDevBack(task_id=task_id, user_id=uid))

            # Dev front
            db.query(TaskDevFront).filter(TaskDevFront.task_id == task_id).delete()
            for uid in dev_front_users:
                if uid:
                    db.add(TaskDevFront(task_id=task_id, user_id=uid))

            # QA
            db.query(TaskQA).filter(TaskQA.task_id == task_id).delete()
            for uid in qa_users:
                if uid:
                    db.add(TaskQA(task_id=task_id, user_id=uid))

            # Reteste
            db.query(TaskReteste).filter(TaskReteste.task_id == task_id).delete()
            for uid in reteste_users:
                if uid:
                    db.add(TaskReteste(task_id=task_id, user_id=uid))

            # Tags
            db.query(TaskTag).filter(TaskTag.task_id == task_id).delete()
            for tag in raw.get("tags", []):
                tag_name = tag.get("name") if isinstance(tag, dict) else str(tag)
                if tag_name:
                    db.add(TaskTag(task_id=task_id, tag=tag_name))

        db.commit()

        from datetime import datetime as dt
        config.last_synced_at = dt.now(timezone.utc)
        log.status = "success"
        log.tasks_synced = len(all_tasks)
        log.tasks_created = created
        log.tasks_updated = updated
        log.finished_at = dt.now(timezone.utc)
        db.commit()

    except Exception as e:
        db.rollback()
        log.status = "error"
        log.error_message = str(e)
        log.finished_at = datetime.now(timezone.utc)
        db.commit()

    return log
