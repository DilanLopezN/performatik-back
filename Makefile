.PHONY: help install dev build start stop logs clean migrate seed studio deploy

# Default target
help:
	@echo "NestJS Template - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install     - Install dependencies"
	@echo "  make dev         - Start development environment (Docker)"
	@echo "  make dev-local   - Start development locally (no Docker)"
	@echo "  make stop        - Stop all containers"
	@echo "  make logs        - Show container logs"
	@echo "  make clean       - Remove containers and volumes"
	@echo ""
	@echo "Database:"
	@echo "  make migrate     - Run database migrations"
	@echo "  make seed        - Seed the database"
	@echo "  make studio      - Open Prisma Studio"
	@echo ""
	@echo "Production:"
	@echo "  make build       - Build for production"
	@echo "  make prod        - Start production environment"
	@echo "  make deploy      - Build and deploy"
	@echo ""

# Development
install:
	npm install

dev:
	docker-compose up -d
	@echo "🚀 Development environment started!"
	@echo "API: http://localhost:3000/api/v1"
	@echo "Docs: http://localhost:3000/api/docs"

dev-local:
	npm run start:dev

dev-with-studio:
	docker-compose --profile dev up -d
	@echo "🚀 Development environment with Prisma Studio started!"
	@echo "API: http://localhost:3000/api/v1"
	@echo "Prisma Studio: http://localhost:5555"

stop:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v --remove-orphans
	rm -rf node_modules dist

# Database
migrate:
	npx prisma migrate dev

migrate-prod:
	npx prisma migrate deploy

seed:
	npx prisma db seed

studio:
	npx prisma studio

generate:
	npx prisma generate

# Production
build:
	npm run build

prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
	@echo "🚀 Production environment started!"

deploy: build
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Testing
test:
	npm run test

test-cov:
	npm run test:cov

test-e2e:
	npm run test:e2e

# Linting
lint:
	npm run lint

format:
	npm run format
