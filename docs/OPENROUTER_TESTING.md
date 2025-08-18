# 🧪 Тестирование OpenRouter.ai интеграции

## 🎯 Цель тестирования

Проверить, что OpenRouter.ai работает как основной AI провайдер, а OpenAI служит как fallback опция.

## 🚀 Подготовка к тестированию

### 1. **Настройка .env файла**
```bash
# Обязательно для OpenRouter
OPENROUTER_ENABLED=true
OPENROUTER_API_KEY=sk-or-your-actual-key-here

# OpenAI как fallback
OPENAI_API_KEY=sk-your-openai-key-here

# Настройки провайдера
AI_DEFAULT_PROVIDER=openrouter
AI_FALLBACK_ENABLED=true
AI_FALLBACK_ORDER=openrouter,openai,anthropic
```

### 2. **Запуск проекта**
```bash
# Запуск инфраструктуры
make infra-up

# Установка зависимостей
make install

# Запуск backend
make dev
```

## 🔍 Тестовые сценарии

### **Тест 1: Проверка доступности провайдеров**

```bash
# Проверка статуса AI сервисов
curl http://localhost:3000/api/ai/status

# Проверка доступных провайдеров
curl http://localhost:3000/api/ai/providers

# Проверка здоровья сервисов
curl http://localhost:3000/api/ai/health
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "data": {
    "providers": ["openrouter", "openai"],
    "health": {
      "openai": true,
      "openrouter": true,
      "anthropic": false
    },
    "currentProvider": "openrouter"
  }
}
```

### **Тест 2: Генерация презентации через OpenRouter**

```bash
curl -X POST http://localhost:3000/api/ai/presentations/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Преимущества искусственного интеллекта",
    "slideCount": 5,
    "audience": "business",
    "style": "formal",
    "language": "ru"
  }'
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "data": {
    "title": "Преимущества искусственного интеллекта",
    "slides": [...],
    "provider": "openrouter",
    "model": "openai/gpt-4o"
  }
}
```

### **Тест 3: Генерация контента слайда**

```bash
curl -X POST http://localhost:3000/api/ai/slides/generate \
  -H "Content-Type: application/json" \
  -d '{
    "slideNumber": 1,
    "slideTitle": "Введение в ИИ",
    "context": "Презентация о преимуществах ИИ",
    "layout": "title"
  }'
```

### **Тест 4: Анализ лайаута**

```bash
curl -X POST http://localhost:3000/api/ai/layouts/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "slideData": {
      "title": "Тестовый слайд",
      "content": ["Пункт 1", "Пункт 2"],
      "layout": "content"
    },
    "targetAudience": "business"
  }'
```

### **Тест 5: Прямое AI completion**

```bash
curl -X POST http://localhost:3000/api/ai/complete \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Создай заголовок для слайда о технологиях"}
    ],
    "task": "content_generation"
  }'
```

## 🔄 Тестирование Fallback

### **Тест 6: Fallback на OpenAI при недоступности OpenRouter**

1. **Временно отключите OpenRouter** (измените API ключ на неверный)
2. **Выполните запрос:**
```bash
curl -X POST http://localhost:3000/api/ai/complete \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Тест fallback"}
    ]
  }'
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "data": {
    "content": "...",
    "provider": "openai",
    "metadata": {
      "fallbackUsed": true
    }
  }
}
```

### **Тест 7: Переключение провайдера**

```bash
# Переключение на OpenAI
curl -X POST http://localhost:3000/api/ai/providers/switch \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai"}'

# Проверка текущего провайдера
curl http://localhost:3000/api/ai/providers
```

## 📊 Мониторинг и логи

### **Проверка логов backend**
```bash
# Просмотр логов в реальном времени
docker logs -f slides_backend

# Поиск AI запросов
docker logs slides_backend | grep "AI completion"
```

### **Ожидаемые логи:**
```
[INFO] Attempting AI completion with provider: openrouter
[INFO] OpenRouter completion successful
[INFO] Presentation structure generated successfully
```

## 🚨 Тестирование ошибок

### **Тест 8: Обработка ошибок OpenRouter**

1. **Используйте неверный API ключ**
2. **Выполните запрос**
3. **Проверьте fallback на OpenAI**

### **Тест 9: Обработка ошибок OpenAI**

1. **Используйте неверный OpenAI API ключ**
2. **Выполните запрос**
3. **Проверьте fallback на другие провайдеры**

## 🎯 Критерии успешного тестирования

### ✅ **Обязательные проверки:**
1. **OpenRouter работает** как основной провайдер
2. **OpenAI доступен** как fallback
3. **Автоматический fallback** при сбоях
4. **Генерация контента** работает корректно
5. **API endpoints** отвечают правильно
6. **Логирование** работает корректно

### 📊 **Метрики производительности:**
- Время ответа OpenRouter: < 5 секунд
- Время fallback: < 2 секунд
- Успешность запросов: > 95%

## 🔧 Устранение проблем

### **Проблема: OpenRouter недоступен**
```bash
# Проверьте API ключ
echo $OPENROUTER_API_KEY

# Проверьте доступность сервиса
curl https://openrouter.ai/api/v1/models
```

### **Проблема: OpenAI недоступен**
```bash
# Проверьте API ключ
echo $OPENAI_API_KEY

# Проверьте баланс OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/dashboard/billing/credit_grants
```

### **Проблема: Ошибки в логах**
```bash
# Проверьте конфигурацию
cat .env | grep -E "(OPENROUTER|OPENAI|AI_)"

# Проверьте статус сервисов
make status
```

## 📝 Чек-лист тестирования

- [ ] OpenRouter API ключ настроен
- [ ] OpenAI API ключ настроен
- [ ] Backend запущен и доступен
- [ ] AI провайдеры отвечают на health check
- [ ] Генерация презентации работает
- [ ] Генерация слайдов работает
- [ ] Анализ лайаутов работает
- [ ] Fallback на OpenAI работает
- [ ] Переключение провайдеров работает
- [ ] Логирование работает корректно
- [ ] API endpoints отвечают правильно
- [ ] Обработка ошибок работает

## 🎉 Завершение тестирования

После успешного прохождения всех тестов:

1. **OpenRouter.ai интегрирован** как основной AI провайдер
2. **OpenAI работает** как надежный fallback
3. **Система готова** к продакшен использованию
4. **Документация обновлена** с примерами использования

---

**🎯 Цель достигнута: OpenRouter.ai = Основной провайдер, OpenAI = Fallback опция!**
