# Настройка переменных окружения (.env)

## 🚀 Быстрый старт

1. **Скопируйте файл конфигурации:**
   ```bash
   cp .env.example .env
   ```

2. **Отредактируйте .env файл** и заполните обязательные поля
3. **Запустите проект:** `make setup`

## 🔑 Обязательные переменные

### 1. **OpenAI API Key** (для ИИ-генерации контента)
```bash
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```
**Как получить:**
- Зарегистрируйтесь на [OpenAI Platform](https://platform.openai.com/)
- Перейдите в [API Keys](https://platform.openai.com/api-keys)
- Создайте новый API ключ
- Скопируйте ключ (начинается с `sk-`)

### 2. **JWT Secret** (для аутентификации)
```bash
JWT_SECRET=your-super-secret-jwt-key-here
```
**Как сгенерировать:**
```bash
# Автоматически сгенерировать случайный ключ
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Или использовать онлайн генератор
# https://generate-secret.vercel.app/32
```

### 3. **PostgreSQL URL** (для базы данных)
```bash
POSTGRES_URL=postgresql://slides_user:slides_password@localhost:5432/slides_wanted
```
**Используется по умолчанию** при запуске через Docker Compose

### 4. **Redis URL** (для кеширования)
```bash
REDIS_URL=redis://localhost:6379
```
**Используется по умолчанию** при запуске через Docker Compose

## 🎯 Полный список переменных

### Основные настройки
```bash
NODE_ENV=development          # Окружение: development, production, test
PORT=3000                     # Порт backend сервера
FRONTEND_PORT=3001           # Порт frontend приложения
API_VERSION=v1               # Версия API
```

### База данных (PostgreSQL)
```bash
POSTGRES_URL=postgresql://slides_user:slides_password@localhost:5432/slides_wanted
POSTGRES_HOST=localhost       # Хост базы данных
POSTGRES_PORT=5432           # Порт базы данных
POSTGRES_DB=slides_wanted    # Имя базы данных
POSTGRES_USER=slides_user    # Пользователь базы данных
POSTGRES_PASSWORD=slides_password  # Пароль базы данных
POSTGRES_SSL=false           # Использовать SSL
```

### Redis (Кеширование)
```bash
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost         # Хост Redis
REDIS_PORT=6379             # Порт Redis
REDIS_PASSWORD=              # Пароль Redis (если есть)
REDIS_DB=0                  # Номер базы данных Redis
```

### MinIO (Файловое хранилище)
```bash
MINIO_ENDPOINT=localhost     # Хост MinIO
MINIO_PORT=9000             # Порт MinIO
MINIO_USE_SSL=false         # Использовать SSL
MINIO_ACCESS_KEY=minioadmin # Ключ доступа
MINIO_SECRET_KEY=minioadmin # Секретный ключ
MINIO_BUCKET_NAME=slides-wanted  # Имя bucket'а
```

### OpenAI (ИИ сервис)
```bash
OPENAI_API_KEY=sk-...        # API ключ OpenAI
OPENAI_MODEL=gpt-4           # Модель для генерации
OPENAI_MAX_TOKENS=4000       # Максимальное количество токенов
OPENAI_TEMPERATURE=0.7       # Креативность (0.0 - 1.0)
```

### Безопасность
```bash
JWT_SECRET=your-secret-key   # Секретный ключ для JWT
JWT_EXPIRES_IN=7d           # Время жизни access токена
JWT_REFRESH_EXPIRES_IN=30d  # Время жизни refresh токена
CORS_ORIGIN=http://localhost:3001  # Разрешенные origins
RATE_LIMIT_MAX_REQUESTS=100  # Лимит запросов в минуту
```

### Логирование
```bash
LOG_LEVEL=debug              # Уровень логирования
LOG_FORMAT=json              # Формат логов
LOG_ENABLE_CONSOLE=true      # Вывод в консоль
LOG_ENABLE_FILE=false        # Запись в файл
```

### Экспорт
```bash
PUPPETEER_HEADLESS=true      # Запуск браузера в фоне
PUPPETEER_TIMEOUT=30000     # Таймаут для PDF экспорта
PPTX_COMPRESSION_LEVEL=6    # Уровень сжатия PPTX
PPTX_IMAGE_QUALITY=80       # Качество изображений
```

## 📝 Пример заполненного .env файла

```bash
# =============================================================================
# КОНФИГУРАЦИЯ ОКРУЖЕНИЯ - AI Presentation Builder MVP
# =============================================================================

# Основные настройки
NODE_ENV=development
PORT=3000
FRONTEND_PORT=3001
API_VERSION=v1

# База данных
POSTGRES_URL=postgresql://slides_user:slides_password@localhost:5432/slides_wanted

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=slides-wanted

# OpenAI (ОБЯЗАТЕЛЬНО!)
OPENAI_API_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcdef

# JWT (ОБЯЗАТЕЛЬНО!)
JWT_SECRET=58e8e9895a27609a9829a849cce4af6f33884e6299b7b9918d13c241e08acf27

# CORS
CORS_ORIGIN=http://localhost:3001
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Логирование
LOG_LEVEL=debug
LOG_FORMAT=json

# Экспорт
PUPPETEER_HEADLESS=true
PPTX_COMPRESSION_LEVEL=6
PPTX_IMAGE_QUALITY=80
```

## 🚨 Важные замечания

### Безопасность
- **НИКОГДА не коммитьте .env файл** в git
- Добавьте `.env` в `.gitignore`
- Используйте разные ключи для разработки и продакшена
- Регулярно ротируйте API ключи

### Разработка vs Продакшен
```bash
# Разработка
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3001

# Продакшен
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
```

### Docker окружение
При запуске через Docker Compose большинство переменных уже настроены:
- База данных: `postgres:5432`
- Redis: `redis:6379`
- MinIO: `minio:9000`

## 🔧 Проверка конфигурации

После настройки .env файла проверьте конфигурацию:

```bash
# Запуск инфраструктуры
make infra-up

# Проверка статуса
make status

# Просмотр логов
make logs

# Тест подключения
curl http://localhost:3000/health
```

## 🆘 Решение проблем

### Ошибка "Missing required environment variables"
Проверьте, что все обязательные переменные заполнены:
- `POSTGRES_URL`
- `REDIS_URL`
- `OPENAI_API_KEY`
- `JWT_SECRET`

### Ошибка подключения к базе данных
```bash
# Проверьте статус PostgreSQL
docker ps | grep postgres

# Проверьте логи
docker logs slides_postgres
```

### Ошибка OpenAI API
```bash
# Проверьте API ключ
echo $OPENAI_API_KEY

# Проверьте баланс на OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/dashboard/billing/credit_grants
```

## 📚 Дополнительные ресурсы

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
- [Redis Configuration](https://redis.io/docs/management/config/)
- [MinIO Quickstart](https://min.io/docs/minio/linux/quickstart/quickstart.html)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
