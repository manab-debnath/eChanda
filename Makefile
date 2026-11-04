SHELL := /bin/bash
.DEFAULT_GOAL := help

# Environment file selection
ENV_FILE ?= .env

# Load the selected environment file
ifneq ($(wildcard $(ENV_FILE)),)
include $(ENV_FILE)
else
$(warning Environment file '$(ENV_FILE)' not found)
endif

# Export variables to child processes
export

MIGRATE := migrate
MIGRATIONS_DIR := migrations

.PHONY: help up down create force version check-db check-migrate

help:
	@echo "Available migration commands:"
	@echo "  make up                                                    Apply pending migrations"
	@echo "  make up ENV_FILE=.env.production"
	@echo "  make down                                                  Roll back the latest migration"
	@echo "  make down ENV_FILE=.env.production"
	@echo "  make down COUNT=3                                          Roll back the latest 3 migrations"
	@echo "  make create NAME=add_users                                 Create migration files"
	@echo "  make force VERSION=3                                       Force migration version (recovery only)"
	@echo "  make version                                               Show current migration version"
	@echo "  make version ENV_FILE=.env.production                      Show current migration version"

check-migrate:
	@command -v $(MIGRATE) >/dev/null 2>&1 || { \
		echo "Error: golang-migrate CLI not found in PATH"; exit 1; \
	}
	@test -d "$(MIGRATIONS_DIR)" || { \
		echo "Error: migrations directory not found"; exit 1; \
	}

check-db:
	@test -n "$(DATABASE_URL)" || { \
		echo "Error: DATABASE_URL is missing"; exit 1; \
	}
	@echo "Using environment file: $(ENV_FILE)"
	@echo "DATABASE_URL is configured"

up: check-migrate check-db
	@$(MIGRATE) -path "$(MIGRATIONS_DIR)" -database "$(DATABASE_URL)" up

down: check-migrate check-db
	@count="$(COUNT)"; \
	count="$${count:-1}"; \
	if ! [[ "$$count" =~ ^[1-9][0-9]*$$ ]]; then \
		echo "Error: COUNT must be a positive integer"; exit 1; \
	fi; \
	read -r -p "Roll back $$count migration(s)? [y/N] " confirm; \
	if [[ "$$confirm" =~ ^[yY]$$ ]]; then \
		$(MIGRATE) -path "$(MIGRATIONS_DIR)" \
			-database "$(DATABASE_URL)" down "$$count"; \
	else \
		echo "Rollback cancelled."; \
	fi

create: check-migrate
	@test -n "$(NAME)" || { \
		echo "Usage: make create NAME=change_issuer_to_optional"; exit 1; \
	}
	$(MIGRATE) create -ext sql -dir "$(MIGRATIONS_DIR)" -seq "$(NAME)"

version: check-migrate check-db
	@$(MIGRATE) -path "$(MIGRATIONS_DIR)" -database "$(DATABASE_URL)" version

force: check-migrate check-db
	@echo "WARNING: force changes migration tracking only; it does not execute SQL."
	@read -r -p "Continue? [y/N] " confirm; \
	if [[ "$$confirm" =~ ^[yY]$$ ]]; then \
		$(MIGRATE) -path "$(MIGRATIONS_DIR)" \
			-database "$(DATABASE_URL)" force "$(VERSION)"; \
	else \
		echo "Force operation cancelled."; \
	fi
