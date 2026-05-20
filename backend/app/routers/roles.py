from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from ..models.user import UserRole, User
from ..services.auth_service import require_admin

router = APIRouter(prefix="/roles", tags=["roles"])

ALL_PERMISSIONS = [
    {"key": "dashboard",         "label": "Dashboard",             "group": "Páginas"},
    {"key": "tasks",             "label": "Tarefas",               "group": "Páginas"},
    {"key": "visao_geral",       "label": "Visão Geral",           "group": "Páginas"},
    {"key": "planejamento",      "label": "Planejamento",          "group": "Páginas"},
    {"key": "homologacao",       "label": "Homologação",           "group": "Páginas"},
    {"key": "executive",         "label": "Métricas Executivas",   "group": "Páginas"},
    {"key": "bugs_por_programa", "label": "Bugs por Programa",     "group": "Páginas"},
    {"key": "admin_users",       "label": "Gerenciar Usuários",    "group": "Administração"},
    {"key": "admin_sync",        "label": "Sincronização",         "group": "Administração"},
    {"key": "admin_database",    "label": "Banco de Dados",        "group": "Administração"},
    {"key": "admin_roles",       "label": "Gerenciar Perfis",      "group": "Administração"},
]


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None


class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    permissions: List[str]
    user_count: int

    class Config:
        from_attributes = True


@router.get("/permissions")
def list_permissions(_: User = Depends(require_admin)):
    return ALL_PERMISSIONS


@router.get("/", response_model=List[RoleOut])
def list_roles(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    roles = db.query(UserRole).all()
    return [
        RoleOut(
            id=r.id,
            name=r.name,
            description=r.description,
            permissions=r.permissions or [],
            user_count=len(r.users),
        )
        for r in roles
    ]


@router.post("/", response_model=RoleOut, status_code=201)
def create_role(payload: RoleCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(UserRole).filter(UserRole.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Já existe um perfil com este nome")
    role = UserRole(name=payload.name, description=payload.description, permissions=payload.permissions)
    db.add(role)
    db.commit()
    db.refresh(role)
    return RoleOut(id=role.id, name=role.name, description=role.description,
                   permissions=role.permissions or [], user_count=0)


@router.put("/{role_id}", response_model=RoleOut)
def update_role(role_id: int, payload: RoleUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    role = db.get(UserRole, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    if payload.name is not None:
        existing = db.query(UserRole).filter(UserRole.name == payload.name, UserRole.id != role_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Já existe um perfil com este nome")
        role.name = payload.name
    if payload.description is not None:
        role.description = payload.description
    if payload.permissions is not None:
        role.permissions = payload.permissions
    db.commit()
    db.refresh(role)
    return RoleOut(id=role.id, name=role.name, description=role.description,
                   permissions=role.permissions or [], user_count=len(role.users))


@router.delete("/{role_id}", status_code=204)
def delete_role(role_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    role = db.get(UserRole, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    if role.name == "admin":
        raise HTTPException(status_code=400, detail="O perfil admin não pode ser excluído")
    if role.users:
        raise HTTPException(status_code=400, detail=f"Este perfil possui {len(role.users)} usuário(s) vinculado(s)")
    db.delete(role)
    db.commit()
