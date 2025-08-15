# AI-Powered Presentation Builder

Интеллектуальное приложение для создания презентаций с использованием ИИ-движка, который предлагает как контент на основе идеи презентации, так и оптимальные лайауты для слайдов.

## 🚀 Возможности

- **ИИ-генерация контента** - автоматическое создание слайдов на основе описания
- **Умная оптимизация лайаутов** - ML-алгоритмы для выбора лучших компоновок
- **Шаблоны презентаций** - загрузка и использование собственных шаблонов
- **Экспорт в форматы** - PPTX, PDF, HTML
- **Реальное время** - WebSocket для интерактивного взаимодействия

## 🏗️ Архитектура

- **Frontend**: React + TypeScript + Fabric.js (Canvas Editor)
- **Backend**: Node.js + TypeScript + Express
- **База данных**: PostgreSQL + Redis
- **Хранилище**: MinIO (S3-совместимое)
- **ИИ**: OpenAI API + собственные ML модели
- **Коммуникация**: WebSocket + REST API

## 📋 Требования

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd slides_wanted
```

### 2. Настройка окружения
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

### 3. Запуск инфраструктуры
```bash
make infra-up
```

### 4. Установка зависимостей
```bash
make install
```

### 5. Запуск приложения
```bash
make dev
```

## 📁 Структура проекта

```
slides_wanted/
├── backend/                 # Backend сервисы
├── frontend/                # Frontend приложение
├── shared/                  # Общие типы и утилиты
├── docs/                    # Документация
├── docker/                  # Docker конфигурация
├── scripts/                 # Скрипты развертывания
└── README.md
```

## 🛠️ Команды Make

- `make install` - установка зависимостей
- `make dev` - запуск в режиме разработки
- `make build` - сборка проекта
- `make test` - запуск тестов
- `make infra-up` - запуск инфраструктуры
- `make infra-down` - остановка инфраструктуры
- `make clean` - очистка проекта

## 📚 Документация

- [Архитектура](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Разработка](./docs/DEVELOPMENT.md)
- [Деплой](./docs/DEPLOYMENT.md)

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл для деталей.

## 🆘 Поддержка

- Создайте Issue для багов и feature requests
- Обратитесь к [документации](./docs/)
- Свяжитесь с командой разработки
