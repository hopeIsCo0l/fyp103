"""Extract plain text from resume files for CV–job matching."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

MAX_CV_UPLOAD_BYTES = 5 * 1024 * 1024
_ALLOWED_SUFFIXES = frozenset({".pdf", ".docx", ".txt"})


class CvExtractionError(Exception):
    """Domain error with a stable machine-readable code."""

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        super().__init__(message)


def extract_text_from_upload(filename: str, data: bytes) -> str:
    """Return UTF-8 text from PDF, DOCX, or plain text. Raises CvExtractionError."""
    if not data:
        raise CvExtractionError("empty_file", "The uploaded file is empty.")
    if len(data) > MAX_CV_UPLOAD_BYTES:
        raise CvExtractionError(
            "file_too_large",
            f"File exceeds maximum size of {MAX_CV_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    suffix = Path(filename or "").suffix.lower()
    if suffix not in _ALLOWED_SUFFIXES:
        raise CvExtractionError(
            "unsupported_type",
            "Unsupported format. Upload a PDF, DOCX, or TXT file.",
        )

    if suffix == ".txt":
        text = data.decode("utf-8", errors="replace")
    elif suffix == ".pdf":
        text = _extract_pdf(data)
    else:
        text = _extract_docx(data)

    cleaned = text.strip()
    if not cleaned:
        raise CvExtractionError(
            "no_text_extracted",
            "No readable text was found in this file. Try another format or paste text manually.",
        )
    return cleaned


def _extract_pdf(data: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(BytesIO(data))
    parts: list[str] = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            parts.append(t)
    return "\n".join(parts)


def _extract_docx(data: bytes) -> str:
    from docx import Document

    doc = Document(BytesIO(data))
    lines = [p.text for p in doc.paragraphs if p.text and p.text.strip()]
    return "\n".join(lines)
