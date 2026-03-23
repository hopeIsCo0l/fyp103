# Create recruit_db in PostgreSQL (run once)
# Uses psql if available, or Python/SQLAlchemy
$conn = "postgresql://postgres:postgres@localhost:5432/postgres"

try {
    $engine = python -c "
from sqlalchemy import create_engine, text
e = create_engine('$conn')
e.execute(text('CREATE DATABASE recruit_db'))
print('Database recruit_db created')
" 2>&1
    Write-Host $engine
} catch {
    Write-Host "If psql is available: psql -h localhost -U postgres -c 'CREATE DATABASE recruit_db;'"
}
