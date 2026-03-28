"""Optional phone normalization for signup and admin (max length for DB)."""


def normalize_phone(value: str | None) -> str | None:
    if value is None:
        return None
    s = value.strip()
    if not s:
        return None
    return s[:32]
