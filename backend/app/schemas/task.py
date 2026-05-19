from pydantic import BaseModel, field_validator
from typing import Optional, List, Any
from datetime import datetime


class AssigneeOut(BaseModel):
    id: int
    username: Optional[str]
    email: Optional[str]

    class Config:
        from_attributes = True


class TaskOut(BaseModel):
    id: str
    custom_item_id: Optional[int]
    name: str
    status_name: Optional[str]
    status_color: Optional[str]
    status_type: Optional[str]
    status_orderindex: Optional[int]
    priority: Optional[str]
    date_created: Optional[datetime]
    date_updated: Optional[datetime]
    date_done: Optional[datetime]
    archived: bool
    programa: Optional[str]
    lote: Optional[str]
    reaberto: Optional[str]
    motivo_block: Optional[str]
    prioridade_custom: Optional[str]
    quantidade_linhas: Optional[int]
    ordem_atendimento: Optional[int]
    desenv_back_inicio: Optional[datetime]
    desenv_back_finalizado: Optional[datetime]
    desenv_front_inicio: Optional[datetime]
    desenv_front_finalizado: Optional[datetime]
    inicio_qa: Optional[datetime]
    fim_qa: Optional[datetime]
    qa_inicio: Optional[datetime]
    qa_finalizado: Optional[datetime]
    inicio_homologacao: Optional[datetime]
    liberacao_hml_lello: Optional[datetime]
    aprovacao_hml_lello: Optional[datetime]
    aprovacao_prod_lello: Optional[datetime]
    aplicacao_producao: Optional[datetime]
    reteste_inicio: Optional[datetime]
    reteste_finalizado: Optional[datetime]
    bugs_em_aberto: Optional[int]
    bugs_totais: Optional[int]
    previsao_entrega: Optional[datetime]
    assignees: List[AssigneeOut] = []
    dev_back: List[AssigneeOut] = []
    dev_front: List[AssigneeOut] = []
    qa: List[AssigneeOut] = []
    reteste: List[AssigneeOut] = []
    tags: List[str] = []

    @field_validator('tags', mode='before')
    @classmethod
    def extract_tags(cls, v: Any) -> List[str]:
        if not v:
            return []
        return [item.tag if hasattr(item, 'tag') else str(item) for item in v]

    class Config:
        from_attributes = True


class TaskFilters(BaseModel):
    custom_item_id: Optional[int] = None
    status_name: Optional[str] = None
    search: Optional[str] = None
    assignee_id: Optional[int] = None
    week_start: Optional[str] = None
    week_end: Optional[str] = None
