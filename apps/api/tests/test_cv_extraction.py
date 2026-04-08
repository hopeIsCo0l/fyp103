"""Unit tests for resume text extraction."""

import pytest

from app.cv_extraction import (
    MAX_CV_UPLOAD_BYTES,
    CvExtractionError,
    extract_text_from_upload,
)


def test_extract_txt_basic():
    data = "Hello world\nSecond line".encode("utf-8")
    out = extract_text_from_upload("resume.txt", data)
    assert "Hello world" in out
    assert "Second line" in out


def test_unsupported_extension():
    with pytest.raises(CvExtractionError) as exc:
        extract_text_from_upload("file.exe", b"x")
    assert exc.value.code == "unsupported_type"


def test_empty_file():
    with pytest.raises(CvExtractionError) as exc:
        extract_text_from_upload("a.txt", b"")
    assert exc.value.code == "empty_file"


def test_file_too_large():
    with pytest.raises(CvExtractionError) as exc:
        extract_text_from_upload("a.txt", b"x" * (MAX_CV_UPLOAD_BYTES + 1))
    assert exc.value.code == "file_too_large"


def test_txt_whitespace_only_raises():
    with pytest.raises(CvExtractionError) as exc:
        extract_text_from_upload("a.txt", b"   \n\t  ")
    assert exc.value.code == "no_text_extracted"
