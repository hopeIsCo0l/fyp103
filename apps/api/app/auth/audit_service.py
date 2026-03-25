import json
import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def write_audit_log(
    db: Session,
    *,
    action: str,
    actor_id: str | None = None,
    target_type: str | None = None,
    target_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    log = AuditLog(
        id=str(uuid.uuid4()),
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata_json=json.dumps(metadata or {}, ensure_ascii=True),
    )
    db.add(log)
    db.commit()
