from sqlalchemy import Column, DateTime, Index, String, Text
from sqlalchemy.sql import func

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_created_actor_action", "created_at", "actor_id", "action"),
    )

    id = Column(String(36), primary_key=True, index=True)
    actor_id = Column(String(36), nullable=True, index=True)
    action = Column(String(120), nullable=False, index=True)
    target_type = Column(String(64), nullable=True)
    target_id = Column(String(64), nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
