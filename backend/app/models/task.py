from sqlalchemy import Column, Integer, BigInteger, String, Boolean, Text, DateTime, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class ClickupUser(Base):
    __tablename__ = "clickup_users"

    id = Column(BigInteger, primary_key=True)
    username = Column(String(255))
    email = Column(String(255))
    color = Column(String(50))
    profile_picture = Column(Text)


class ClickupStatus(Base):
    __tablename__ = "clickup_statuses"

    id = Column(String(100), primary_key=True)
    status = Column(String(255), nullable=False)
    color = Column(String(50))
    type = Column(String(50))
    orderindex = Column(Integer)


class ClickupList(Base):
    __tablename__ = "clickup_lists"

    id = Column(String(100), primary_key=True)
    name = Column(String(500))
    sync_config_id = Column(Integer, ForeignKey("sync_config.id"))


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(100), primary_key=True)
    custom_id = Column(String(100))
    custom_item_id = Column(Integer, index=True)
    name = Column(Text, nullable=False)
    text_content = Column(Text)
    status_id = Column(String(100), ForeignKey("clickup_statuses.id"))
    status_name = Column(String(255), index=True)
    status_color = Column(String(50))
    status_type = Column(String(50))
    status_orderindex = Column(Integer)
    priority = Column(String(50))
    date_created = Column(DateTime(timezone=True), index=True)
    date_updated = Column(DateTime(timezone=True), index=True)
    date_closed = Column(DateTime(timezone=True))
    date_done = Column(DateTime(timezone=True), index=True)
    archived = Column(Boolean, default=False)
    creator_id = Column(BigInteger, ForeignKey("clickup_users.id"))
    list_id = Column(String(100), ForeignKey("clickup_lists.id"))
    orderindex = Column(Text)

    programa = Column(String(500))
    lote = Column(String(255))
    prioridade_custom = Column(String(100))
    desenv_back_inicio = Column(DateTime(timezone=True))
    desenv_back_finalizado = Column(DateTime(timezone=True))
    desenv_front_inicio = Column(DateTime(timezone=True))
    desenv_front_finalizado = Column(DateTime(timezone=True))
    inicio_qa = Column(DateTime(timezone=True))
    fim_qa = Column(DateTime(timezone=True))
    qa_inicio = Column(DateTime(timezone=True))
    qa_finalizado = Column(DateTime(timezone=True))
    inicio_homologacao = Column(DateTime(timezone=True))
    liberacao_hml_lello = Column(DateTime(timezone=True))
    aprovacao_hml_lello = Column(DateTime(timezone=True))
    aprovacao_prod_lello = Column(DateTime(timezone=True))
    aplicacao_producao = Column(DateTime(timezone=True))
    reteste_inicio = Column(DateTime(timezone=True))
    reteste_finalizado = Column(DateTime(timezone=True))
    bugs_em_aberto = Column(Integer, default=0)
    bugs_totais = Column(Integer, default=0)
    quantidade_linhas = Column(Integer)
    ordem_atendimento = Column(Integer)
    reaberto = Column(String(255))
    motivo_block = Column(Text)
    previsao_entrega = Column(DateTime(timezone=True))
    observacoes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    status = relationship("ClickupStatus")
    creator = relationship("ClickupUser", foreign_keys=[creator_id])
    assignees = relationship("ClickupUser", secondary="task_assignees")
    dev_back = relationship("ClickupUser", secondary="task_dev_back")
    dev_front = relationship("ClickupUser", secondary="task_dev_front")
    qa = relationship("ClickupUser", secondary="task_qa")
    reteste = relationship("ClickupUser", secondary="task_reteste")
    tags = relationship("TaskTag", cascade="all, delete-orphan")
    custom_fields = relationship("TaskCustomFieldRaw", cascade="all, delete-orphan")


class TaskAssignee(Base):
    __tablename__ = "task_assignees"

    task_id = Column(String(100), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("clickup_users.id"), primary_key=True)


class TaskDevBack(Base):
    __tablename__ = "task_dev_back"

    task_id = Column(String(100), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("clickup_users.id"), primary_key=True)


class TaskDevFront(Base):
    __tablename__ = "task_dev_front"

    task_id = Column(String(100), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("clickup_users.id"), primary_key=True)


class TaskQA(Base):
    __tablename__ = "task_qa"

    task_id = Column(String(100), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("clickup_users.id"), primary_key=True)


class TaskReteste(Base):
    __tablename__ = "task_reteste"

    task_id = Column(String(100), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("clickup_users.id"), primary_key=True)


class TaskTag(Base):
    __tablename__ = "task_tags"

    task_id = Column(String(100), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    tag = Column(String(255), primary_key=True)


class TaskCustomFieldRaw(Base):
    __tablename__ = "task_custom_fields_raw"

    id = Column(Integer, primary_key=True)
    task_id = Column(String(100), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    field_id = Column(String(100), nullable=False)
    field_name = Column(String(255))
    field_type = Column(String(100))
    value_text = Column(Text)
    value_number = Column(Numeric)
    value_date = Column(DateTime(timezone=True))
    value_json = Column(JSONB)

    __table_args__ = (UniqueConstraint("task_id", "field_id"),)
