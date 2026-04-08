FROM python:3.12-slim

WORKDIR /app

ENV PIP_DEFAULT_TIMEOUT=120 \
    PYTHONUNBUFFERED=1

# Build context must be repo root (see docker-compose.yml) so local packages exist.
COPY packages/database /packages/database
RUN python -m pip install --no-cache-dir -e /packages/database
COPY packages/ai-engine /packages/ai-engine
RUN python -m pip install --no-cache-dir -e /packages/ai-engine

COPY apps/api/requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY apps/api .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
