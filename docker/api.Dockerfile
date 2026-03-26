FROM python:3.12-slim

WORKDIR /app

# Wheels only (psycopg2-binary); skip apt to avoid heavy builds/OOM on low Docker memory
ENV PIP_DEFAULT_TIMEOUT=120 PIP_RETRIES=10
COPY requirements.docker.txt .
RUN pip install --no-cache-dir --retries 10 --timeout 120 -r requirements.docker.txt

COPY . .

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
