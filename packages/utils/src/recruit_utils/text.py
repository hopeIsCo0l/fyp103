"""Text helpers; extend with Amharic-specific normalization as needed."""


def normalize_whitespace(text: str) -> str:
    """Collapse runs of whitespace; strip ends."""
    return " ".join(text.split())
