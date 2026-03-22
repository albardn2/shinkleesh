# Makefile for Alembic migrations

# You can override ALEMBIC and MSG on the command line, e.g.:
#   make revision MSG="Add users table"
ALEMBIC ?= alembic
MSG     ?= "Auto migration"
ENV_FILE ?= .env

.PHONY: revision upgrade reset

## Create a new migration, auto-generating based on your models.
## Usage: make revision MSG="Describe your migration"
revision:
	@echo ">>> Generating new migration: $(MSG)"
	@set -a; . ./$(ENV_FILE); set +a; $(ALEMBIC) revision --autogenerate -m "$(MSG)"

## Apply all pending migrations (upgrade to head)
upgrade:
	@echo ">>> Upgrading database to head"
	@set -a; . ./$(ENV_FILE); set +a; $(ALEMBIC) upgrade head

## Wipe the database and re-run all migrations from scratch
reset:
	@echo ">>> Wiping database..."
	@set -a; . ./$(ENV_FILE); set +a; \
		psql -U $$POSTGRES_USER -h localhost -d postgres -c "DROP DATABASE IF EXISTS $$POSTGRES_DB;" && \
		psql -U $$POSTGRES_USER -h localhost -d postgres -c "CREATE DATABASE $$POSTGRES_DB;" && \
		echo ">>> Running migrations..." && \
		$(ALEMBIC) upgrade head
