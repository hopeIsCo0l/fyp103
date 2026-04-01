# Migration Verification Record

Date: 2026-04-01  
Environment: local Docker Postgres (`docker-postgres-1`) + API Alembic CLI

## Objective

Formally verify Alembic behavior for both:

1. clean database bootstrap (`base -> head`)
2. existing database upgrade (`003_add_job_applications -> head`)

## Scenario A: Clean DB (`recruit_migrate_clean`)

### Commands

```powershell
docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS recruit_migrate_clean;"
docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d postgres -c "CREATE DATABASE recruit_migrate_clean;"

$env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5433/recruit_migrate_clean"
apps/api/venv311/Scripts/python.exe -m alembic -c apps/api/alembic.ini upgrade head

docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d recruit_migrate_clean -c "SELECT version_num FROM alembic_version;"
docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d recruit_migrate_clean -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='job_applications' AND column_name IN ('cv_text','cv_similarity_score') ORDER BY column_name;"
docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d recruit_migrate_clean -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='jobs' AND column_name='criteria_weights';"
```

### Result

- Alembic revision after migration: `005_add_application_cv_match`
- `job_applications` has:
  - `cv_text`
  - `cv_similarity_score`
- `jobs` has:
  - `criteria_weights`

Status: **pass**

## Scenario B: Existing DB Upgrade (`recruit_migrate_existing`)

### Commands

```powershell
docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS recruit_migrate_existing;"
docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d postgres -c "CREATE DATABASE recruit_migrate_existing;"

$env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5433/recruit_migrate_existing"
apps/api/venv311/Scripts/python.exe -m alembic -c apps/api/alembic.ini upgrade 003_add_job_applications

docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d recruit_migrate_existing -c "SELECT version_num FROM alembic_version;"
docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d recruit_migrate_existing -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='job_applications' AND column_name IN ('cv_text','cv_similarity_score') ORDER BY column_name;"
docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d recruit_migrate_existing -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='jobs' AND column_name='criteria_weights';"

apps/api/venv311/Scripts/python.exe -m alembic -c apps/api/alembic.ini upgrade head

docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d recruit_migrate_existing -c "SELECT version_num FROM alembic_version;"
docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d recruit_migrate_existing -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='job_applications' AND column_name IN ('cv_text','cv_similarity_score') ORDER BY column_name;"
docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d recruit_migrate_existing -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='jobs' AND column_name='criteria_weights';"
```

### Result

- Mid revision verified: `003_add_job_applications`
- At revision `003`:
  - `job_applications.cv_text` absent
  - `job_applications.cv_similarity_score` absent
  - `jobs.criteria_weights` absent
- Upgraded to head successfully (`005_add_application_cv_match`)
- Post-upgrade columns present as expected.

Status: **pass**

## Automated Coverage

- `apps/api/tests/test_migrations.py::test_alembic_downgrade_base_then_upgrade_head`
- `apps/api/tests/test_migrations.py::test_alembic_upgrade_from_003_to_head_adds_scoring_columns`
