# PostgreSQL Backup and Restore Runbook

This runbook targets the default Docker stack in this repository.

## Preconditions

- Docker Desktop running.
- Services started with `.\scripts\docker-up.ps1` or `docker compose up`.
- Postgres reachable as configured in `docker/docker-compose.yml`.

## Backup (logical dump)

Run from repository root:

```powershell
docker compose -f docker/docker-compose.yml exec postgres \
  pg_dump -U postgres -d recruit_db -Fc -f /tmp/recruit_db.dump
docker compose -f docker/docker-compose.yml cp \
  postgres:/tmp/recruit_db.dump ./artifacts/recruit_db.dump
```

Expected result:
- `artifacts/recruit_db.dump` exists and is non-empty.

## Restore (to target DB)

Warning: this command drops and recreates schema objects in target DB.

```powershell
docker compose -f docker/docker-compose.yml cp \
  ./artifacts/recruit_db.dump postgres:/tmp/recruit_db.dump
docker compose -f docker/docker-compose.yml exec postgres \
  pg_restore -U postgres -d recruit_db --clean --if-exists /tmp/recruit_db.dump
```

## Verification

```powershell
docker compose -f docker/docker-compose.yml exec postgres \
  psql -U postgres -d recruit_db -c "\dt"
curl http://localhost:8000/ready
```

Pass criteria:
- Key tables exist (`users`, `jobs`, `job_applications`, etc.).
- API readiness endpoint returns HTTP `200`.

## Rehearsal Evidence (fill after each drill)

| Date | Operator | Environment | Backup path | Restore target | Result | Notes |
|---|---|---|---|---|---|---|
| YYYY-MM-DD | @owner | local/staging | `artifacts/recruit_db.dump` | `recruit_db` | pass/fail | observations |
| 2026-04-01 | Abdel | local | `artifacts/recruit_db.dump` | `recruit_db` | pass | `pg_dump` + `pg_restore --clean --if-exists`; verified tables via `\dt` and `/ready` 200 |
