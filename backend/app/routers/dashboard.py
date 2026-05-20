from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, case, and_
from typing import Optional
from datetime import datetime, timezone, timedelta
from unicodedata import normalize as _unicode_normalize
import re
from ..database import get_db
from ..models.task import Task, TaskAssignee, ClickupUser
from ..models.user import User
from ..schemas.task import TaskOut
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

QA_MEMBERS = ["Thiago", "Ana Keila", "Juliana Oliveira", "Pedro Samuel", "Cristian"]

PHASE_GROUPS = [
    {
        "key": "backlog",
        "label": "Backlog",
        "color": "#94a3b8",
        "statuses": ["Backlog"],
    },
    {
        "key": "migrando",
        "label": "Migrando",
        "color": "#0074e8",
        "statuses": [
            "Soma QA Liax",
            "Em qa",
            "Entregar para Homologação",
            "Qa aprovado com dependencia",
            "Ag desenv. Front",
            "Reteste QA",
            "Ag Finalizar Bugs",
            "Deploy",
        ],
    },
    {
        "key": "hml_lello",
        "label": "HML Lello",
        "color": "#6366f1",
        "statuses": ["Soma Homologação Lello", "Homologação Aprovada"],
    },
    {
        "key": "defeitos_hml",
        "label": "Defeitos HML",
        "color": "#f97316",
        "statuses": ["Homolgação com bugs", "Homologação com bugs"],
    },
    {
        "key": "producao",
        "label": "Produção",
        "color": "#17dd30",
        "statuses": ["Prog.Prod Aprovados", "Programas Cancelados Prod"],
    },
    {
        "key": "defeitos_prod",
        "label": "Defeitos Prod",
        "color": "#cc3366",
        "statuses": ["Prog. Em Prod c/ Bug"],
    },
    {
        "key": "block",
        "label": "Block",
        "color": "#1c3775",
        "statuses": ["Soma Block", "Falta Detalhamento"],
    },
]


def _is_qa(username: str) -> bool:
    return any(qa.lower() in (username or "").lower() for qa in QA_MEMBERS)


def _iso_week(dt: datetime) -> str:
    return dt.strftime("%G-W%V")


def _get_week_filtered_tasks(db: Session, week_start: Optional[str], week_end: Optional[str]):
    tasks = db.query(Task).all()
    if not week_start and not week_end:
        return tasks

    def task_week(t: Task) -> Optional[str]:
        ref = t.date_updated or t.date_created
        return _iso_week(ref) if ref else None

    def in_range(w: Optional[str]) -> bool:
        if not w:
            return False
        if week_start and w < week_start:
            return False
        if week_end and w > week_end:
            return False
        return True

    return [t for t in tasks if in_range(task_week(t))]


def _normalize_text(value: Optional[str]) -> str:
    if not value:
        return ""
    normalized = _unicode_normalize("NFKD", value)
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^a-zA-Z0-9]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip().lower()


def _phase_for_status(status_name: Optional[str]):
    normalized = _normalize_text(status_name)
    if not normalized:
        return None
    for phase in PHASE_GROUPS:
        for candidate in phase["statuses"]:
            candidate_norm = _normalize_text(candidate)
            if normalized == candidate_norm or normalized in candidate_norm or candidate_norm in normalized:
                return phase
    return None


def _serialize_task(task: Task) -> dict:
    return TaskOut.model_validate(task, from_attributes=True).model_dump(mode="json")


@router.get("/summary")
def summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total = db.query(func.count(Task.id)).scalar()
    migrations = db.query(func.count(Task.id)).filter(Task.custom_item_id == 0).scalar()
    bugs = db.query(func.count(Task.id)).filter(Task.custom_item_id == 1004).scalar()
    improvements = db.query(func.count(Task.id)).filter(Task.custom_item_id == 1005).scalar()
    completed = db.query(func.count(Task.id)).filter(Task.date_done != None).scalar()
    return {
        "total": total,
        "migrations": migrations,
        "bugs": bugs,
        "improvements": improvements,
        "completed": completed,
    }


@router.get("/migrations-per-week")
def migrations_per_week(
    week_start: Optional[str] = Query(None),
    week_end: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tasks = db.query(Task).filter(
        Task.custom_item_id == 0,
        Task.status_name.ilike("%homolog%"),
        Task.bugs_em_aberto == 0,
        Task.date_updated != None,
    ).all()

    weeks: dict = {}
    for t in tasks:
        w = _iso_week(t.date_updated)
        if week_start and w < week_start:
            continue
        if week_end and w > week_end:
            continue
        weeks[w] = weeks.get(w, 0) + 1

    return [{"week": k, "count": v} for k, v in sorted(weeks.items())]


@router.get("/migration-time")
def migration_time(exclude_extremes: bool = False, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from sqlalchemy.orm import selectinload
    tasks = (
        db.query(Task)
        .options(
            selectinload(Task.assignees),
            selectinload(Task.dev_back),
            selectinload(Task.dev_front),
            selectinload(Task.qa),
            selectinload(Task.reteste),
            selectinload(Task.tags),
        )
        .filter(Task.custom_item_id == 0)
        .order_by(Task.status_orderindex.asc().nullsfirst(), Task.date_created.desc())
        .all()
    )

    def _task_dict(t: Task) -> dict:
        def _ul(rels):
            return [{"id": u.id, "username": u.username or "", "email": u.email or ""} for u in rels]
        def _iso(dt):
            return dt.isoformat() if dt else None
        return {
            "id": t.id, "name": t.name, "custom_item_id": t.custom_item_id,
            "programa": t.programa, "lote": t.lote,
            "status_name": t.status_name, "status_color": t.status_color,
            "status_type": t.status_type, "status_orderindex": t.status_orderindex,
            "priority": t.priority, "archived": t.archived,
            "date_created": _iso(t.date_created), "date_updated": _iso(t.date_updated),
            "date_done": _iso(t.date_done),
            "quantidade_linhas": t.quantidade_linhas, "ordem_atendimento": t.ordem_atendimento,
            "bugs_em_aberto": t.bugs_em_aberto, "bugs_totais": t.bugs_totais,
            "reaberto": t.reaberto, "motivo_block": t.motivo_block, "prioridade_custom": t.prioridade_custom,
            "desenv_back_inicio": _iso(t.desenv_back_inicio), "desenv_back_finalizado": _iso(t.desenv_back_finalizado),
            "desenv_front_inicio": _iso(t.desenv_front_inicio), "desenv_front_finalizado": _iso(t.desenv_front_finalizado),
            "qa_inicio": _iso(t.qa_inicio), "qa_finalizado": _iso(t.qa_finalizado),
            "reteste_inicio": _iso(t.reteste_inicio), "reteste_finalizado": _iso(t.reteste_finalizado),
            "liberacao_hml_lello": _iso(t.liberacao_hml_lello), "aprovacao_hml_lello": _iso(t.aprovacao_hml_lello),
            "aprovacao_prod_lello": _iso(t.aprovacao_prod_lello), "aplicacao_producao": _iso(t.aplicacao_producao),
            "inicio_qa": None, "fim_qa": None, "inicio_homologacao": None, "previsao_entrega": None,
            "assignees": _ul(t.assignees), "dev_back": _ul(t.dev_back), "dev_front": _ul(t.dev_front),
            "qa": _ul(t.qa), "reteste": _ul(t.reteste),
            "tags": [tt.tag for tt in t.tags],
        }

    def _phase_stats(triples, get_worked=None):
        entries = []
        for start, end, t in triples:
            if start and end and end > start:
                entries.append(((end - start).days, t))
        if not entries:
            return {"average": None, "average_worked": None, "fastest": None, "slowest": None, "count": 0,
                    "fastest_task": None, "slowest_task": None, "excluded_count": 0}
        diffs = [d for d, _ in entries]
        min_days = min(diffs)
        max_days = max(diffs)
        fastest_task = next(t for d, t in entries if d == min_days)
        slowest_task = next(t for d, t in entries if d == max_days)

        calc_entries = entries
        excluded_count = 0
        if exclude_extremes and len(entries) > 2:
            min_idx = next(i for i, (d, _) in enumerate(entries) if d == min_days)
            max_idx = next(i for i, (d, _) in enumerate(entries) if d == max_days)
            remove = {min_idx, max_idx}
            calc_entries = [e for i, e in enumerate(entries) if i not in remove]
            excluded_count = len(remove)

        calc_diffs = [d for d, _ in calc_entries]
        avg_worked = None
        if get_worked:
            worked = [w for _, t in calc_entries for w in [get_worked(t)] if w is not None]
            avg_worked = round(sum(worked) / len(worked), 1) if worked else None
        return {
            "average": round(sum(calc_diffs) / len(calc_diffs), 1),
            "average_worked": avg_worked,
            "fastest": min_days,
            "slowest": max_days,
            "count": len(calc_diffs),
            "excluded_count": excluded_count,
            "tasks": [_task_dict(t) for _, t in calc_entries],
            "fastest_task": _task_dict(fastest_task),
            "slowest_task": _task_dict(slowest_task),
        }

    def _dev_end(t: Task):
        if t.desenv_front_finalizado:
            return t.desenv_front_finalizado
        if t.desenv_back_finalizado and (t.qa_inicio or t.aprovacao_hml_lello or t.liberacao_hml_lello or t.aprovacao_prod_lello):
            return t.desenv_back_finalizado
        return None

    def _dev_worked(t: Task):
        total = 0
        if t.desenv_back_inicio and t.desenv_back_finalizado and t.desenv_back_finalizado > t.desenv_back_inicio:
            total += (t.desenv_back_finalizado - t.desenv_back_inicio).days
        if t.desenv_front_inicio and t.desenv_front_finalizado and t.desenv_front_finalizado > t.desenv_front_inicio:
            total += (t.desenv_front_finalizado - t.desenv_front_inicio).days
        return total if total > 0 else None

    def _qa_worked(t: Task):
        total = 0
        if t.qa_inicio and t.qa_finalizado and t.qa_finalizado > t.qa_inicio:
            total += (t.qa_finalizado - t.qa_inicio).days
        if t.reteste_inicio and t.reteste_finalizado and t.reteste_finalizado > t.reteste_inicio:
            total += (t.reteste_finalizado - t.reteste_inicio).days
        return total if total > 0 else None

    def _hml_worked(t: Task):
        if t.liberacao_hml_lello and t.aprovacao_hml_lello and t.aprovacao_hml_lello > t.liberacao_hml_lello:
            return (t.aprovacao_hml_lello - t.liberacao_hml_lello).days
        return None

    def _prod_worked(t: Task):
        if t.aplicacao_producao and t.aprovacao_prod_lello and t.aprovacao_prod_lello > t.aplicacao_producao:
            return (t.aprovacao_prod_lello - t.aplicacao_producao).days
        return None

    def _total_worked(t: Task):
        parts = [_dev_worked(t), _qa_worked(t), _hml_worked(t), _prod_worked(t)]
        valid = [p for p in parts if p is not None]
        return sum(valid) if valid else None

    dev_triples   = [(t.desenv_back_inicio, _dev_end(t), t) for t in tasks if t.desenv_back_inicio and _dev_end(t)]
    qa_triples    = [(t.qa_inicio, t.qa_finalizado, t) for t in tasks if t.qa_inicio and t.qa_finalizado]
    hml_triples   = [(t.liberacao_hml_lello, t.aprovacao_hml_lello, t) for t in tasks if t.liberacao_hml_lello and t.aprovacao_hml_lello]
    prod_triples  = [(t.aplicacao_producao, t.aprovacao_prod_lello, t) for t in tasks if t.aplicacao_producao and t.aprovacao_prod_lello]
    total_triples = [(t.desenv_back_inicio, t.aprovacao_prod_lello, t) for t in tasks if t.desenv_back_inicio and t.aprovacao_prod_lello]

    return {
        "dev":   _phase_stats(dev_triples,   get_worked=_dev_worked),
        "qa":    _phase_stats(qa_triples,    get_worked=_qa_worked),
        "hml":   _phase_stats(hml_triples,   get_worked=_hml_worked),
        "prod":  _phase_stats(prod_triples,  get_worked=_prod_worked),
        "total": _phase_stats(total_triples, get_worked=_total_worked),
        "exclude_extremes": exclude_extremes,
    }


@router.get("/migrations-by-status")
def migrations_by_status(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = (
        db.query(Task.status_name, Task.status_color, func.count(Task.id).label("count"))
        .filter(Task.custom_item_id == 0)
        .group_by(Task.status_name, Task.status_color)
        .all()
    )
    return [{"status": r[0], "color": r[1], "count": r[2]} for r in sorted(rows, key=lambda x: -x[2])]


@router.get("/phase-distribution")
def phase_distribution(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    tasks = (
        db.query(Task)
        .options(
            selectinload(Task.assignees),
            selectinload(Task.dev_back),
            selectinload(Task.dev_front),
            selectinload(Task.qa),
            selectinload(Task.reteste),
            selectinload(Task.tags),
        )
        .filter(Task.custom_item_id == 0)
        .all()
    )

    grouped = {
        phase["key"]: {
            "key": phase["key"],
            "label": phase["label"],
            "color": phase["color"],
            "count": 0,
            "tasks": [],
        }
        for phase in PHASE_GROUPS
    }

    for task in tasks:
        phase = _phase_for_status(task.status_name)
        if not phase:
            continue
        grouped[phase["key"]]["count"] += 1
        grouped[phase["key"]]["tasks"].append(_serialize_task(task))

    return [grouped[phase["key"]] for phase in PHASE_GROUPS]


@router.get("/tasks-completed-per-week")
def tasks_completed_per_week(
    week_start: Optional[str] = Query(None),
    week_end: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tasks = db.query(Task).filter(Task.date_done != None).all()
    weeks: dict = {}
    for t in tasks:
        w = _iso_week(t.date_done)
        if week_start and w < week_start:
            continue
        if week_end and w > week_end:
            continue
        weeks[w] = weeks.get(w, 0) + 1
    return [{"week": k, "count": v} for k, v in sorted(weeks.items())]


@router.get("/tasks-by-collaborator")
def tasks_by_collaborator(
    week_start: Optional[str] = Query(None),
    week_end: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tasks_all = db.query(Task).all()

    # Contadores por tipo de atuação
    dev_back_counts: dict = {}
    dev_front_counts: dict = {}
    qa_counts: dict = {}
    reteste_counts: dict = {}

    for t in tasks_all:
        ref = t.date_updated or t.date_created
        if not ref:
            continue
        w = _iso_week(ref)
        if week_start and w < week_start:
            continue
        if week_end and w > week_end:
            continue

        for u in t.dev_back:
            name = u.username or "Desconhecido"
            dev_back_counts[name] = dev_back_counts.get(name, 0) + 1

        for u in t.dev_front:
            name = u.username or "Desconhecido"
            dev_front_counts[name] = dev_front_counts.get(name, 0) + 1

        for u in t.qa:
            name = u.username or "Desconhecido"
            qa_counts[name] = qa_counts.get(name, 0) + 1

        # Reteste: se não tiver usuários de reteste, usa os de QA
        reteste_users = t.reteste if t.reteste else t.qa
        for u in reteste_users:
            name = u.username or "Desconhecido"
            reteste_counts[name] = reteste_counts.get(name, 0) + 1

    # Total agregado por colaborador (dev_back + dev_front + qa)
    all_counts: dict = {}
    for name, cnt in dev_back_counts.items():
        all_counts[name] = all_counts.get(name, 0) + cnt
    for name, cnt in dev_front_counts.items():
        all_counts[name] = all_counts.get(name, 0) + cnt
    for name, cnt in qa_counts.items():
        all_counts[name] = all_counts.get(name, 0) + cnt

    dev_counts = {}
    for name, cnt in dev_back_counts.items():
        dev_counts[name] = dev_counts.get(name, 0) + cnt
    for name, cnt in dev_front_counts.items():
        dev_counts[name] = dev_counts.get(name, 0) + cnt

    return {
        "all": [{"name": k, "count": v} for k, v in sorted(all_counts.items(), key=lambda x: -x[1])],
        "qa": [{"name": k, "count": v} for k, v in sorted(qa_counts.items(), key=lambda x: -x[1])],
        "dev": [{"name": k, "count": v} for k, v in sorted(dev_counts.items(), key=lambda x: -x[1])],
        "dev_back": [{"name": k, "count": v} for k, v in sorted(dev_back_counts.items(), key=lambda x: -x[1])],
        "dev_front": [{"name": k, "count": v} for k, v in sorted(dev_front_counts.items(), key=lambda x: -x[1])],
        "reteste": [{"name": k, "count": v} for k, v in sorted(reteste_counts.items(), key=lambda x: -x[1])],
    }


@router.get("/bugs-per-week")
def bugs_per_week(
    week_start: Optional[str] = Query(None),
    week_end: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tasks = db.query(Task).filter(Task.custom_item_id == 1004, Task.date_created != None).all()
    weeks: dict = {}
    for t in tasks:
        w = _iso_week(t.date_created)
        if week_start and w < week_start:
            continue
        if week_end and w > week_end:
            continue
        weeks[w] = weeks.get(w, 0) + 1
    return [{"week": k, "count": v} for k, v in sorted(weeks.items())]


@router.get("/liberacoes-hml-per-week")
def liberacoes_hml_per_week(
    week_start: Optional[str] = Query(None),
    week_end: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tasks = db.query(Task).filter(Task.liberacao_hml_lello != None).all()
    weeks: dict = {}
    for t in tasks:
        w = _iso_week(t.liberacao_hml_lello)
        if week_start and w < week_start:
            continue
        if week_end and w > week_end:
            continue
        weeks[w] = weeks.get(w, 0) + 1
    return [{"week": k, "count": v} for k, v in sorted(weeks.items())]


@router.get("/liberacoes-hml-summary")
def liberacoes_hml_summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total = db.query(func.count(Task.id)).filter(Task.liberacao_hml_lello != None).scalar()
    migrations = db.query(func.count(Task.id)).filter(
        Task.liberacao_hml_lello != None, Task.custom_item_id == 0
    ).scalar()
    last = db.query(func.max(Task.liberacao_hml_lello)).scalar()
    return {
        "total": total,
        "migrations": migrations,
        "last_date": last.strftime("%d/%m/%Y") if last else None,
    }


@router.get("/bugs-by-programa")
def bugs_by_programa(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from ..models.task import TaskTag
    from sqlalchemy.orm import selectinload
    from collections import defaultdict

    bugs = (
        db.query(Task)
        .options(selectinload(Task.tags))
        .filter(Task.custom_item_id == 1004, Task.programa != None)
        .all()
    )

    data: dict = defaultdict(lambda: {"qa": 0, "homologacao": 0, "producao": 0, "total": 0})
    for bug in bugs:
        prog = bug.programa
        tag_names = {tt.tag.lower() for tt in bug.tags}
        if "producao" in tag_names or "produção" in tag_names:
            data[prog]["producao"] += 1
        elif "homologacao" in tag_names or "homologação" in tag_names:
            data[prog]["homologacao"] += 1
        else:
            data[prog]["qa"] += 1
        data[prog]["total"] += 1

    return sorted(
        [{"programa": k, **v} for k, v in data.items()],
        key=lambda x: -x["total"],
    )


@router.get("/available-weeks")
def available_weeks(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    tasks = db.query(Task).all()
    weeks = set()
    for t in tasks:
        for dt in [t.date_created, t.date_updated, t.date_done]:
            if dt:
                weeks.add(_iso_week(dt))
    return sorted(list(weeks))


@router.get("/planning-comparison")
def planning_comparison(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from collections import defaultdict
    from sqlalchemy.orm import selectinload

    target_year = year or datetime.now(timezone.utc).year
    current_year = datetime.now(timezone.utc).year
    current_month = datetime.now(timezone.utc).month

    metric_defs = {
        "liberacao_hml": {
            "field": "liberacao_hml_lello",
            "label": "Liberação para homologação",
        },
        "aprovacao_hml": {
            "field": "aprovacao_hml_lello",
            "label": "Aprovação de homologação",
        },
        "aprovacao_prod": {
            "field": "aprovacao_prod_lello",
            "label": "Aprovação de produção",
        },
    }

    tasks = (
        db.query(Task)
        .options(
            selectinload(Task.assignees),
            selectinload(Task.dev_back),
            selectinload(Task.dev_front),
            selectinload(Task.qa),
            selectinload(Task.reteste),
            selectinload(Task.tags),
        )
        .filter(Task.custom_item_id == 0, Task.archived == False)
        .all()
    )

    month_labels = {
        1: "Janeiro",
        2: "Fevereiro",
        3: "Março",
        4: "Abril",
        5: "Maio",
        6: "Junho",
        7: "Julho",
        8: "Agosto",
        9: "Setembro",
        10: "Outubro",
        11: "Novembro",
        12: "Dezembro",
    }

    months = {
        month: {
            "month": month,
            "label": month_labels[month],
            "actuals": {metric_key: 0 for metric_key in metric_defs},
            "tasks": {metric_key: [] for metric_key in metric_defs},
            "programs_map": {metric_key: defaultdict(int) for metric_key in metric_defs},
        }
        for month in range(1, 13)
    }
    def _task_dict(t: Task, metric_key: Optional[str] = None, metric_date: Optional[datetime] = None) -> dict:
        def _ul(rels):
            return [{"id": u.id, "username": u.username or "", "email": u.email or ""} for u in rels]

        return {
            "id": t.id,
            "name": t.name,
            "programa": t.programa or "Sem programa",
            "lote": t.lote,
            "status_name": t.status_name,
            "status_color": t.status_color,
            "status_type": t.status_type,
            "status_orderindex": t.status_orderindex,
            "priority": t.priority,
            "archived": t.archived,
            "date_created": t.date_created.isoformat() if t.date_created else None,
            "date_updated": t.date_updated.isoformat() if t.date_updated else None,
            "date_done": t.date_done.isoformat() if t.date_done else None,
            "metric_key": metric_key,
            "metric_date": metric_date.isoformat() if metric_date else None,
            "custom_item_id": t.custom_item_id,
            "quantidade_linhas": t.quantidade_linhas,
            "ordem_atendimento": t.ordem_atendimento,
            "bugs_em_aberto": t.bugs_em_aberto,
            "bugs_totais": t.bugs_totais,
            "reaberto": t.reaberto,
            "motivo_block": t.motivo_block,
            "prioridade_custom": t.prioridade_custom,
            "desenv_back_inicio": t.desenv_back_inicio.isoformat() if t.desenv_back_inicio else None,
            "desenv_back_finalizado": t.desenv_back_finalizado.isoformat() if t.desenv_back_finalizado else None,
            "desenv_front_inicio": t.desenv_front_inicio.isoformat() if t.desenv_front_inicio else None,
            "desenv_front_finalizado": t.desenv_front_finalizado.isoformat() if t.desenv_front_finalizado else None,
            "qa_inicio": t.qa_inicio.isoformat() if t.qa_inicio else None,
            "qa_finalizado": t.qa_finalizado.isoformat() if t.qa_finalizado else None,
            "reteste_inicio": t.reteste_inicio.isoformat() if t.reteste_inicio else None,
            "reteste_finalizado": t.reteste_finalizado.isoformat() if t.reteste_finalizado else None,
            "liberacao_hml_lello": t.liberacao_hml_lello.isoformat() if t.liberacao_hml_lello else None,
            "aprovacao_hml_lello": t.aprovacao_hml_lello.isoformat() if t.aprovacao_hml_lello else None,
            "aprovacao_prod_lello": t.aprovacao_prod_lello.isoformat() if t.aprovacao_prod_lello else None,
            "aplicacao_producao": t.aplicacao_producao.isoformat() if t.aplicacao_producao else None,
            "inicio_qa": None,
            "fim_qa": None,
            "inicio_homologacao": None,
            "previsao_entrega": None,
            "assignees": _ul(t.assignees),
            "dev_back": _ul(t.dev_back),
            "dev_front": _ul(t.dev_front),
            "qa": _ul(t.qa),
            "reteste": _ul(t.reteste),
            "tags": [tt.tag for tt in t.tags],
        }

    for t in tasks:
        for metric_key, metric in metric_defs.items():
            dt = getattr(t, metric["field"])
            if not dt:
                continue
            if dt.year != target_year:
                continue

            month = dt.month
            month_bucket = months[month]
            programa = t.programa or "Sem programa"

            month_bucket["actuals"][metric_key] += 1
            month_bucket["programs_map"][metric_key][programa] += 1
            month_bucket["tasks"][metric_key].append(_task_dict(t, metric_key, dt))

    months_payload = []
    for month in range(1, 13):
        bucket = months[month]
        tasks_by_metric = {}
        programs_by_metric = {}
        for metric_key in metric_defs:
            tasks_by_metric[metric_key] = sorted(
                bucket["tasks"][metric_key],
                key=lambda x: x["metric_date"] or x["date_done"] or "",
                reverse=True,
            )
            programs_by_metric[metric_key] = [
                {"programa": name, "count": count}
                for name, count in sorted(bucket["programs_map"][metric_key].items(), key=lambda x: (-x[1], x[0]))
            ]

        months_payload.append({
            "month": month,
            "label": bucket["label"],
            "actuals": bucket["actuals"],
            "programs": programs_by_metric,
            "tasks": tasks_by_metric,
        })

    totals_payload = {
        metric_key: sum(month_data["actuals"][metric_key] for month_data in months_payload)
        for metric_key in metric_defs
    }

    return {
        "year": target_year,
        "current_month": current_month if target_year == current_year else 12,
        "metrics": {
            key: {"label": value["label"], "field": value["field"]}
            for key, value in metric_defs.items()
        },
        "totals": totals_payload,
        "months": months_payload,
    }


@router.get("/aprovacoes-hml")
def aprovacoes_hml(
    week_start: Optional[str] = Query(None),
    week_end: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from sqlalchemy.orm import selectinload
    tasks = (
        db.query(Task)
        .options(
            selectinload(Task.assignees),
            selectinload(Task.dev_back),
            selectinload(Task.dev_front),
            selectinload(Task.qa),
            selectinload(Task.reteste),
            selectinload(Task.tags),
        )
        .filter(Task.custom_item_id == 0)
        .filter(Task.archived == False)
        .filter(Task.aprovacao_hml_lello != None)
        .all()
    )

    by_week: dict = {}
    for t in tasks:
        w = _iso_week(t.aprovacao_hml_lello)
        if week_start and w < week_start:
            continue
        if week_end and w > week_end:
            continue
        if w not in by_week:
            by_week[w] = []
        by_week[w].append(t)

    def _user_list(rels):
        return [{"id": u.id, "username": u.username or "", "email": u.email or ""} for u in rels]

    def _task_dict(t: Task) -> dict:
        return {
            "id": t.id,
            "name": t.name,
            "custom_item_id": t.custom_item_id,
            "programa": t.programa,
            "lote": t.lote,
            "status_name": t.status_name,
            "status_color": t.status_color,
            "status_type": t.status_type,
            "status_orderindex": t.status_orderindex,
            "priority": t.priority,
            "date_created": t.date_created.isoformat() if t.date_created else None,
            "date_updated": t.date_updated.isoformat() if t.date_updated else None,
            "date_done": t.date_done.isoformat() if t.date_done else None,
            "archived": t.archived,
            "quantidade_linhas": t.quantidade_linhas,
            "ordem_atendimento": t.ordem_atendimento,
            "bugs_em_aberto": t.bugs_em_aberto,
            "bugs_totais": t.bugs_totais,
            "reaberto": t.reaberto,
            "motivo_block": t.motivo_block,
            "prioridade_custom": t.prioridade_custom,
            "desenv_back_inicio": t.desenv_back_inicio.isoformat() if t.desenv_back_inicio else None,
            "desenv_back_finalizado": t.desenv_back_finalizado.isoformat() if t.desenv_back_finalizado else None,
            "desenv_front_inicio": t.desenv_front_inicio.isoformat() if t.desenv_front_inicio else None,
            "desenv_front_finalizado": t.desenv_front_finalizado.isoformat() if t.desenv_front_finalizado else None,
            "qa_inicio": t.qa_inicio.isoformat() if t.qa_inicio else None,
            "qa_finalizado": t.qa_finalizado.isoformat() if t.qa_finalizado else None,
            "reteste_inicio": t.reteste_inicio.isoformat() if t.reteste_inicio else None,
            "reteste_finalizado": t.reteste_finalizado.isoformat() if t.reteste_finalizado else None,
            "liberacao_hml_lello": t.liberacao_hml_lello.isoformat() if t.liberacao_hml_lello else None,
            "aprovacao_hml_lello": t.aprovacao_hml_lello.isoformat() if t.aprovacao_hml_lello else None,
            "aprovacao_prod_lello": t.aprovacao_prod_lello.isoformat() if t.aprovacao_prod_lello else None,
            "aplicacao_producao": t.aplicacao_producao.isoformat() if t.aplicacao_producao else None,
            "inicio_qa": None,
            "fim_qa": None,
            "inicio_homologacao": None,
            "previsao_entrega": None,
            "assignees": _user_list(t.assignees),
            "dev_back": _user_list(t.dev_back),
            "dev_front": _user_list(t.dev_front),
            "qa": _user_list(t.qa),
            "reteste": _user_list(t.reteste),
            "tags": [tt.tag for tt in t.tags],
        }

    weekly = []
    for week, week_tasks in sorted(by_week.items()):
        weekly.append({
            "week": week,
            "count": len(week_tasks),
            "tasks": [_task_dict(t) for t in sorted(week_tasks, key=lambda x: x.aprovacao_hml_lello)],
        })

    total = sum(len(w["tasks"]) for w in weekly)
    return {
        "total": total,
        "weeks": len(weekly),
        "weekly": weekly,
    }


@router.get("/status-liberacao-hml")
def status_liberacao_hml(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from sqlalchemy.orm import selectinload

    tasks = (
        db.query(Task)
        .options(
            selectinload(Task.assignees),
            selectinload(Task.dev_back),
            selectinload(Task.dev_front),
            selectinload(Task.qa),
            selectinload(Task.reteste),
            selectinload(Task.tags),
        )
        .filter(Task.custom_item_id == 0, Task.archived == False)
        .all()
    )

    def _ul(rels):
        return [{"id": u.id, "username": u.username or "", "email": u.email or ""} for u in rels]

    def _iso(dt):
        return dt.isoformat() if dt else None

    def _task_dict(t: Task, days_waiting: int) -> dict:
        return {
            "id": t.id, "name": t.name, "custom_item_id": t.custom_item_id,
            "programa": t.programa, "lote": t.lote,
            "status_name": t.status_name, "status_color": t.status_color,
            "status_type": t.status_type, "status_orderindex": t.status_orderindex,
            "priority": t.priority, "archived": t.archived,
            "date_created": _iso(t.date_created), "date_updated": _iso(t.date_updated),
            "date_done": _iso(t.date_done),
            "quantidade_linhas": t.quantidade_linhas, "ordem_atendimento": t.ordem_atendimento,
            "bugs_em_aberto": t.bugs_em_aberto, "bugs_totais": t.bugs_totais,
            "reaberto": t.reaberto, "motivo_block": t.motivo_block, "prioridade_custom": t.prioridade_custom,
            "desenv_back_inicio": _iso(t.desenv_back_inicio), "desenv_back_finalizado": _iso(t.desenv_back_finalizado),
            "desenv_front_inicio": _iso(t.desenv_front_inicio), "desenv_front_finalizado": _iso(t.desenv_front_finalizado),
            "qa_inicio": _iso(t.qa_inicio), "qa_finalizado": _iso(t.qa_finalizado),
            "reteste_inicio": _iso(t.reteste_inicio), "reteste_finalizado": _iso(t.reteste_finalizado),
            "liberacao_hml_lello": _iso(t.liberacao_hml_lello), "aprovacao_hml_lello": _iso(t.aprovacao_hml_lello),
            "aprovacao_prod_lello": _iso(t.aprovacao_prod_lello), "aplicacao_producao": _iso(t.aplicacao_producao),
            "inicio_qa": None, "fim_qa": None, "inicio_homologacao": None, "previsao_entrega": None,
            "assignees": _ul(t.assignees), "dev_back": _ul(t.dev_back), "dev_front": _ul(t.dev_front),
            "qa": _ul(t.qa), "reteste": _ul(t.reteste),
            "tags": [tt.tag for tt in t.tags],
            "days_waiting": days_waiting,
        }

    now = datetime.now(timezone.utc)
    liberated = []
    not_liberated = []

    for t in tasks:
        if t.liberacao_hml_lello and not t.aprovacao_hml_lello:
            lib_dt = t.liberacao_hml_lello
            if lib_dt.tzinfo is None:
                lib_dt = lib_dt.replace(tzinfo=timezone.utc)
            liberated.append(_task_dict(t, (now - lib_dt).days))
        elif not t.liberacao_hml_lello:
            not_liberated.append(_task_dict(t, -1))

    liberated.sort(key=lambda x: -x["days_waiting"])

    return {
        "liberated_count": len(liberated),
        "not_liberated_count": len(not_liberated),
        "liberated_tasks": liberated,
    }


@router.get("/production-section")
def production_section(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from sqlalchemy.orm import selectinload

    tasks = (
        db.query(Task)
        .options(
            selectinload(Task.assignees),
            selectinload(Task.dev_back),
            selectinload(Task.dev_front),
            selectinload(Task.qa),
            selectinload(Task.reteste),
            selectinload(Task.tags),
        )
        .filter(Task.archived == False)
        .all()
    )

    def _norm(value):
        return (value or "").lower()

    def _iso(dt):
        return dt.isoformat() if dt else None

    def _ul(rels):
        return [{"id": u.id, "username": u.username or "", "email": u.email or ""} for u in rels]

    def _task_dict(t: Task, metric_label: str, metric_date) -> dict:
        return {
            "id": t.id, "name": t.name, "custom_item_id": t.custom_item_id,
            "programa": t.programa, "lote": t.lote,
            "status_name": t.status_name, "status_color": t.status_color,
            "status_type": t.status_type, "status_orderindex": t.status_orderindex,
            "priority": t.priority, "archived": t.archived,
            "date_created": _iso(t.date_created), "date_updated": _iso(t.date_updated),
            "date_done": _iso(t.date_done),
            "quantidade_linhas": t.quantidade_linhas, "ordem_atendimento": t.ordem_atendimento,
            "bugs_em_aberto": t.bugs_em_aberto, "bugs_totais": t.bugs_totais,
            "reaberto": t.reaberto, "motivo_block": t.motivo_block, "prioridade_custom": t.prioridade_custom,
            "desenv_back_inicio": _iso(t.desenv_back_inicio), "desenv_back_finalizado": _iso(t.desenv_back_finalizado),
            "desenv_front_inicio": _iso(t.desenv_front_inicio), "desenv_front_finalizado": _iso(t.desenv_front_finalizado),
            "qa_inicio": _iso(t.qa_inicio), "qa_finalizado": _iso(t.qa_finalizado),
            "reteste_inicio": _iso(t.reteste_inicio), "reteste_finalizado": _iso(t.reteste_finalizado),
            "liberacao_hml_lello": _iso(t.liberacao_hml_lello), "aprovacao_hml_lello": _iso(t.aprovacao_hml_lello),
            "aprovacao_prod_lello": _iso(t.aprovacao_prod_lello), "aplicacao_producao": _iso(t.aplicacao_producao),
            "inicio_qa": None, "fim_qa": None, "inicio_homologacao": None, "previsao_entrega": None,
            "assignees": _ul(t.assignees), "dev_back": _ul(t.dev_back), "dev_front": _ul(t.dev_front),
            "qa": _ul(t.qa), "reteste": _ul(t.reteste),
            "tags": [tt.tag for tt in t.tags],
            "production_metric_label": metric_label,
            "production_metric_date": _iso(metric_date),
        }

    migrations = [t for t in tasks if t.custom_item_id == 0]
    bugs = [t for t in tasks if t.custom_item_id == 1004]

    approved = [t for t in migrations if "prod" in _norm(t.status_name) and "aprov" in _norm(t.status_name)]
    canceled = [t for t in migrations if "prod" in _norm(t.status_name) and "cancel" in _norm(t.status_name)]
    with_bug = [t for t in migrations if "prod" in _norm(t.status_name) and "bug" in _norm(t.status_name)]
    bugs_prod = [t for t in bugs if "prod" in _norm(t.status_name) and "bug" in _norm(t.status_name)]

    approved_tasks = sorted(
        [_task_dict(t, "Aprovados em produção", t.aprovacao_prod_lello or t.date_updated or t.date_created) for t in approved],
        key=lambda x: x["production_metric_date"] or "",
        reverse=True,
    )
    canceled_tasks = sorted(
        [_task_dict(t, "Migrados em produção cancelados", t.date_updated or t.date_created) for t in canceled],
        key=lambda x: x["production_metric_date"] or "",
        reverse=True,
    )
    with_bug_tasks = sorted(
        [_task_dict(t, "Em produção com bug", t.aplicacao_producao or t.date_updated or t.date_created) for t in with_bug],
        key=lambda x: x["production_metric_date"] or "",
        reverse=True,
    )
    bugs_prod_tasks = sorted(
        [_task_dict(t, "Bugs em produção", t.date_updated or t.date_created) for t in bugs_prod],
        key=lambda x: x["production_metric_date"] or "",
        reverse=True,
    )

    total_map = {}
    for group in (approved_tasks, canceled_tasks, with_bug_tasks):
        for task in group:
            if task["id"] in total_map:
                existing = total_map[task["id"]]
                labels = [part.strip() for part in (existing.get("production_metric_label") or "").split(" • ") if part.strip()]
                if task["production_metric_label"] not in labels:
                    labels.append(task["production_metric_label"])
                    existing["production_metric_label"] = " • ".join(labels)
                if not existing.get("production_metric_date") and task.get("production_metric_date"):
                    existing["production_metric_date"] = task["production_metric_date"]
            else:
                total_map[task["id"]] = dict(task)

    total_tasks = sorted(
        total_map.values(),
        key=lambda x: x["production_metric_date"] or "",
        reverse=True,
    )

    return {
        "approved_count": len(approved_tasks),
        "approved_tasks": approved_tasks,
        "canceled_count": len(canceled_tasks),
        "canceled_tasks": canceled_tasks,
        "with_bug_count": len(with_bug_tasks),
        "with_bug_tasks": with_bug_tasks,
        "bugs_prod_count": len(bugs_prod_tasks),
        "bugs_prod_tasks": bugs_prod_tasks,
        "total_count": len(total_tasks),
        "total_tasks": total_tasks,
    }


@router.get("/bugs-hml-migrations")
def bugs_hml_migrations(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from sqlalchemy.orm import selectinload
    from collections import defaultdict

    bugs = (
        db.query(Task)
        .options(selectinload(Task.tags))
        .filter(Task.custom_item_id == 1004, Task.programa != None, Task.archived == False)
        .all()
    )

    programas_com_bugs_hml = set()
    for bug in bugs:
        tag_names = {tt.tag.lower() for tt in bug.tags}
        if "homologacao" in tag_names or "homologação" in tag_names:
            programas_com_bugs_hml.add(bug.programa)

    if not programas_com_bugs_hml:
        return {"count": 0, "tasks": []}

    migrations = (
        db.query(Task)
        .options(
            selectinload(Task.assignees),
            selectinload(Task.dev_back),
            selectinload(Task.dev_front),
            selectinload(Task.qa),
            selectinload(Task.reteste),
            selectinload(Task.tags),
        )
        .filter(Task.custom_item_id == 0, Task.programa.in_(programas_com_bugs_hml), Task.archived == False)
        .all()
    )

    def _ul(rels):
        return [{"id": u.id, "username": u.username or "", "email": u.email or ""} for u in rels]

    def _iso(dt):
        return dt.isoformat() if dt else None

    def _task_dict(t: Task) -> dict:
        return {
            "id": t.id, "name": t.name, "custom_item_id": t.custom_item_id,
            "programa": t.programa, "lote": t.lote,
            "status_name": t.status_name, "status_color": t.status_color,
            "status_type": t.status_type, "status_orderindex": t.status_orderindex,
            "priority": t.priority, "archived": t.archived,
            "date_created": _iso(t.date_created), "date_updated": _iso(t.date_updated),
            "date_done": _iso(t.date_done),
            "quantidade_linhas": t.quantidade_linhas, "ordem_atendimento": t.ordem_atendimento,
            "bugs_em_aberto": t.bugs_em_aberto, "bugs_totais": t.bugs_totais,
            "reaberto": t.reaberto, "motivo_block": t.motivo_block, "prioridade_custom": t.prioridade_custom,
            "desenv_back_inicio": _iso(t.desenv_back_inicio), "desenv_back_finalizado": _iso(t.desenv_back_finalizado),
            "desenv_front_inicio": _iso(t.desenv_front_inicio), "desenv_front_finalizado": _iso(t.desenv_front_finalizado),
            "qa_inicio": _iso(t.qa_inicio), "qa_finalizado": _iso(t.qa_finalizado),
            "reteste_inicio": _iso(t.reteste_inicio), "reteste_finalizado": _iso(t.reteste_finalizado),
            "liberacao_hml_lello": _iso(t.liberacao_hml_lello), "aprovacao_hml_lello": _iso(t.aprovacao_hml_lello),
            "aprovacao_prod_lello": _iso(t.aprovacao_prod_lello), "aplicacao_producao": _iso(t.aplicacao_producao),
            "inicio_qa": None, "fim_qa": None, "inicio_homologacao": None, "previsao_entrega": None,
            "assignees": _ul(t.assignees), "dev_back": _ul(t.dev_back), "dev_front": _ul(t.dev_front),
            "qa": _ul(t.qa), "reteste": _ul(t.reteste),
            "tags": [tt.tag for tt in t.tags],
        }

    return {
        "count": len(migrations),
        "tasks": [_task_dict(t) for t in migrations],
    }


@router.get("/forecast-data")
def forecast_data(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    migrations = db.query(Task).filter(Task.custom_item_id == 0, Task.archived == False).all()
    total = len(migrations)
    completed = [t for t in migrations if t.aprovacao_hml_lello is not None]
    pending = total - len(completed)

    now = datetime.now(timezone.utc)

    weeks_sample = 12
    cutoff = now - timedelta(weeks=weeks_sample)
    recent_done = [
        t for t in completed
        if t.aprovacao_hml_lello and (
            t.aprovacao_hml_lello if t.aprovacao_hml_lello.tzinfo else t.aprovacao_hml_lello.replace(tzinfo=timezone.utc)
        ) >= cutoff
    ]

    weekly_counts: dict = {}
    for t in recent_done:
        dt = t.aprovacao_hml_lello
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        wk = dt.strftime("%G-W%V")
        weekly_counts[wk] = weekly_counts.get(wk, 0) + 1

    if weekly_counts:
        avg_weekly = round(sum(weekly_counts.values()) / weeks_sample, 2)
    else:
        avg_weekly = 0

    weekly_series = sorted(
        [{"week": k, "count": v} for k, v in weekly_counts.items()],
        key=lambda x: x["week"],
    )

    return {
        "total_migrations": total,
        "completed_migrations": len(completed),
        "pending_migrations": pending,
        "avg_weekly_throughput": avg_weekly,
        "weeks_sample": weeks_sample,
        "weekly_series": weekly_series,
    }
