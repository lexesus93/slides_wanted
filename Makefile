.PHONY: help install dev build test clean infra-up infra-down docker-build docker-push

# Переменные
NODE_VERSION := 18
DOCKER_REGISTRY := localhost:5000
PROJECT_NAME := slides-wanted

# Цвета для вывода
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Показать справку по командам
	@echo "$(GREEN)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

install: ## Установить зависимости
	@echo "$(GREEN)Установка зависимостей...$(NC)"
	@cd backend && npm install
	@cd frontend && npm install
	@echo "$(GREEN)Зависимости установлены!$(NC)"

dev: ## Запустить в режиме разработки
	@echo "$(GREEN)Запуск в режиме разработки...$(NC)"
	@docker-compose -f docker/docker-compose.dev.yml up --build

dev-backend: ## Запустить только backend в режиме разработки
	@echo "$(GREEN)Запуск backend...$(NC)"
	@cd backend && npm run dev

dev-frontend: ## Запустить только frontend в режиме разработки
	@echo "$(GREEN)Запуск frontend...$(NC)"
	@cd frontend && npm run dev

build: ## Собрать проект
	@echo "$(GREEN)Сборка проекта...$(NC)"
	@cd backend && npm run build
	@cd frontend && npm run build
	@echo "$(GREEN)Проект собран!$(NC)"

test: ## Запустить тесты
	@echo "$(GREEN)Запуск тестов...$(NC)"
	@cd backend && npm test
	@cd frontend && npm test

test-backend: ## Запустить тесты backend
	@echo "$(GREEN)Тесты backend...$(NC)"
	@cd backend && npm test

test-frontend: ## Запустить тесты frontend
	@echo "$(GREEN)Тесты frontend...$(NC)"
	@cd frontend && npm test

infra-up: ## Запустить инфраструктуру (Docker)
	@echo "$(GREEN)Запуск инфраструктуры...$(NC)"
	@docker-compose -f docker/docker-compose.yml up -d
	@echo "$(GREEN)Инфраструктура запущена!$(NC)"
	@echo "$(YELLOW)PostgreSQL: localhost:5432$(NC)"
	@echo "$(YELLOW)Redis: localhost:6379$(NC)"
	@echo "$(YELLOW)MinIO: localhost:9000$(NC)"

infra-down: ## Остановить инфраструктуру
	@echo "$(YELLOW)Остановка инфраструктуры...$(NC)"
	@docker-compose -f docker/docker-compose.yml down
	@echo "$(GREEN)Инфраструктура остановлена!$(NC)"

infra-logs: ## Показать логи инфраструктуры
	@docker-compose -f docker/docker-compose.yml logs -f

infra-reset: ## Сбросить инфраструктуру (удалить данные)
	@echo "$(RED)Сброс инфраструктуры...$(NC)"
	@docker-compose -f docker/docker-compose.yml down -v
	@docker-compose -f docker/docker-compose.yml up -d
	@echo "$(GREEN)Инфраструктура сброшена!$(NC)"

docker-build: ## Собрать Docker образы
	@echo "$(GREEN)Сборка Docker образов...$(NC)"
	@docker build -t $(PROJECT_NAME)-backend ./backend
	@docker build -t $(PROJECT_NAME)-frontend ./frontend
	@echo "$(GREEN)Docker образы собраны!$(NC)"

docker-push: ## Отправить Docker образы в registry
	@echo "$(GREEN)Отправка Docker образов...$(NC)"
	@docker tag $(PROJECT_NAME)-backend $(DOCKER_REGISTRY)/$(PROJECT_NAME)-backend:latest
	@docker tag $(PROJECT_NAME)-frontend $(DOCKER_REGISTRY)/$(PROJECT_NAME)-frontend:latest
	@docker push $(DOCKER_REGISTRY)/$(PROJECT_NAME)-backend:latest
	@docker push $(DOCKER_REGISTRY)/$(PROJECT_NAME)-frontend:latest
	@echo "$(GREEN)Docker образы отправлены!$(NC)"

clean: ## Очистить проект
	@echo "$(YELLOW)Очистка проекта...$(NC)"
	@cd backend && npm run clean 2>/dev/null || true
	@cd frontend && npm run clean 2>/dev/null || true
	@rm -rf node_modules backend/node_modules frontend/node_modules
	@rm -rf backend/dist frontend/dist
	@docker system prune -f
	@echo "$(GREEN)Проект очищен!$(NC)"

setup: ## Первоначальная настройка проекта
	@echo "$(GREEN)Первоначальная настройка проекта...$(NC)"
	@cp .env.example .env 2>/dev/null || echo "$(YELLOW).env файл уже существует$(NC)"
	@make install
	@make infra-up
	@echo "$(GREEN)Проект настроен! Отредактируйте .env файл и запустите make dev$(NC)"

db-migrate: ## Запустить миграции базы данных
	@echo "$(GREEN)Запуск миграций...$(NC)"
	@cd backend && npm run migrate

db-seed: ## Заполнить базу данных тестовыми данными
	@echo "$(GREEN)Заполнение базы данных...$(NC)"
	@cd backend && npm run seed

logs: ## Показать логи приложения
	@docker-compose -f docker/docker-compose.dev.yml logs -f

status: ## Показать статус сервисов
	@echo "$(GREEN)Статус сервисов:$(NC)"
	@docker-compose -f docker/docker-compose.yml ps
