# 🚀 Быстрый старт - AI Presentation Builder

## ⚡ 5 минут до запуска

### 1. 📋 Предварительные требования
- ✅ Docker & Docker Compose
- ✅ Node.js 18+
- ✅ Git

### 2. 🔑 Настройка переменных окружения

**Скопируйте и отредактируйте .env файл:**
```bash
cp .env.example .env
```

**ОБЯЗАТЕЛЬНО заполните:**
```bash
# OpenAI API ключ (получите на https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-actual-api-key-here

# JWT секрет (уже сгенерирован)
JWT_SECRET=58e8e9895a27609a9829a849cce4af6f33884e6299b7b9918d13c241e08acf27
```

### 3. 🚀 Запуск проекта

```bash
# Первоначальная настройка
make setup

# Или пошагово:
make infra-up      # Запуск инфраструктуры
make install       # Установка зависимостей
make dev           # Запуск в режиме разработки
```

### 4. 🌐 Доступ к приложению

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **MinIO Console:** http://localhost:9001 (minioadmin/minioadmin)
- **Health Check:** http://localhost:3000/health

## 🔧 Команды управления

```bash
make help          # Справка по всем командам
make status        # Статус сервисов
make logs          # Просмотр логов
make infra-down    # Остановка инфраструктуры
make clean         # Очистка проекта
```

## 🆘 Решение проблем

### Ошибка "Missing required environment variables"
Проверьте .env файл - заполнены ли все обязательные поля:
- `OPENAI_API_KEY`
- `JWT_SECRET`
- `POSTGRES_URL`
- `REDIS_URL`

### Ошибка подключения к базе данных
```bash
make infra-up      # Перезапустите инфраструктуру
make status        # Проверьте статус сервисов
```

### Проблемы с портами
Если порты заняты, измените в .env:
```bash
PORT=3001          # Backend порт
FRONTEND_PORT=3002 # Frontend порт
```

## 📚 Документация

- [Полная настройка .env](./docs/ENV_SETUP.md)
- [Архитектура проекта](./docs/ARCHITECTURE.md)
- [План реализации](./docs/PHASE_1_PLAN.md)
- [Структура проекта](./PROJECT_STRUCTURE.md)

## 🎯 Что дальше?

После успешного запуска:
1. **Откройте** http://localhost:3001
2. **Загрузите** PPTX шаблон
3. **Опишите** презентацию в чате
4. **Редактируйте** в Canvas Editor
5. **Экспортируйте** в PPTX/PDF

---

**Готово! 🎉** Ваш AI Presentation Builder запущен и готов к работе!
