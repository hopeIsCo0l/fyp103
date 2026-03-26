from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock

from fastapi import HTTPException, status


@dataclass
class RateLimitWindow:
    max_attempts: int
    period_seconds: int


_store: dict[str, deque[datetime]] = defaultdict(deque)
_lock = Lock()


def enforce_rate_limit(
    key: str,
    *,
    max_attempts: int,
    period_seconds: int,
    error_message: str = "Too many requests, please try again later.",
) -> None:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(seconds=period_seconds)

    with _lock:
        bucket = _store[key]
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= max_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=error_message,
            )
        bucket.append(now)
