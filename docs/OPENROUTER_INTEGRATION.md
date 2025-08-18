# 🔄 Интеграция OpenRouter.ai

## 🎯 Обзор

OpenRouter.ai предоставляет унифицированный API для доступа к сотням AI моделей через один endpoint, автоматически обрабатывая fallback и выбирая наиболее выгодные варианты.

## 🚀 Преимущества OpenRouter.ai

### ✅ **Основные преимущества:**
- **🎯 Единый API** - доступ к сотням моделей через один endpoint
- **💰 Стоимость** - автоматический выбор наиболее выгодных вариантов
- **🔄 Fallback** - автоматическое переключение при сбоях
- **📊 Мониторинг** - детальная аналитика использования
- **🔒 Приватность** - контроль над логированием данных
- **⚡ Производительность** - оптимизация задержек

### 🆚 **Сравнение с прямым OpenAI:**

| Аспект | OpenAI Direct | OpenRouter.ai |
|--------|---------------|---------------|
| **Модели** | Только OpenAI | 100+ моделей от разных провайдеров |
| **Стоимость** | Фиксированные цены | Автоматическая оптимизация |
| **Fallback** | Ручная настройка | Автоматический |
| **Мониторинг** | Базовый | Детальная аналитика |
| **Приватность** | OpenAI логи | Контролируемое логирование |

## 🔧 Настройка OpenRouter.ai

### 1. **Получение API ключа**
1. Зарегистрируйтесь на [OpenRouter.ai](https://openrouter.ai/)
2. Перейдите в [API Keys](https://openrouter.ai/keys)
3. Создайте новый API ключ
4. Скопируйте ключ

### 2. **Настройка .env файла**
```bash
# Включить OpenRouter.ai
OPENROUTER_ENABLED=true

# API ключ OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Модель по умолчанию
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o

# Fallback модели
OPENROUTER_FALLBACK_MODELS=anthropic/claude-3.5-sonnet,meta-llama/llama-3.1-8b-instruct,google/gemini-pro

# Настройки приложения
OPENROUTER_SITE_URL=http://localhost:3001
OPENROUTER_SITE_NAME=AI Presentation Builder

# Автоматическая оптимизация
OPENROUTER_AUTO_SELECTION=true
OPENROUTER_COST_OPTIMIZATION=true
OPENROUTER_LATENCY_OPTIMIZATION=true
```

### 3. **Переключение провайдера по умолчанию**
```bash
# Использовать OpenRouter как основной провайдер
AI_DEFAULT_PROVIDER=openrouter

# Включить fallback между провайдерами
AI_FALLBACK_ENABLED=true

# Порядок fallback
AI_FALLBACK_ORDER=openrouter,openai,anthropic
```

## 📚 Примеры использования

### 1. **Базовое использование через OpenRouter**
```typescript
import { aiProviderService } from '@/services/ai/ai-provider';

// Создание completion
const response = await aiProviderService.createCompletion({
  messages: [
    { role: 'system', content: 'Ты эксперт по созданию презентаций.' },
    { role: 'user', content: 'Создай слайд о преимуществах ИИ' }
  ],
  task: 'content_generation',
  temperature: 0.7
});

console.log('Ответ:', response.content);
console.log('Модель:', response.model);
console.log('Провайдер:', response.provider);
console.log('Стоимость:', response.metadata.cost);
```

### 2. **Прямое использование OpenRouter сервиса**
```typescript
import { openRouterService } from '@/services/ai/openrouter';

// Получение доступных моделей
const models = await openRouterService.getModels();
console.log('Доступные модели:', models.map(m => m.name));

// Создание completion с конкретной моделью
const response = await openRouterService.createCompletion(
  [
    { role: 'user', content: 'Объясни квантовую физику простыми словами' }
  ],
  {
    model: 'anthropic/claude-3.5-sonnet',
    temperature: 0.3
  }
);

console.log('Ответ:', response.choices[0].message.content);
```

### 3. **Streaming completion**
```typescript
import { openRouterService } from '@/services/ai/openrouter';

// Создание streaming completion
const stream = await openRouterService.createStreamingCompletion(
  [
    { role: 'user', content: 'Напиши стихотворение о технологиях' }
  ],
  {
    model: 'openai/gpt-4o',
    temperature: 0.8
  }
);

// Обработка потока
const reader = stream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = new TextDecoder().decode(value);
  const data = JSON.parse(chunk);
  
  if (data.choices?.[0]?.delta?.content) {
    process.stdout.write(data.choices[0].delta.content);
  }
}
```

### 4. **Автоматический выбор оптимальной модели**
```typescript
import { openRouterService } from '@/services/ai/openrouter';

// Выбор модели для генерации контента
const model = await openRouterService.selectOptimalModel('content_generation', {
  maxCost: 0.01,        // Максимальная стоимость $0.01
  maxLatency: 5000,     // Максимальная задержка 5 секунд
  minQuality: 'high'    // Минимальное качество: высокое
});

console.log('Выбранная модель:', model);

// Использование выбранной модели
const response = await openRouterService.createCompletion(
  messages,
  { model }
);
```

## 🎨 Интеграция в Canvas Editor

### 1. **Генерация контента для слайдов**
```typescript
// В Canvas Editor компоненте
const generateSlideContent = async (prompt: string) => {
  try {
    const response = await aiProviderService.createCompletion({
      messages: [
        { 
          role: 'system', 
          content: 'Ты эксперт по дизайну презентаций. Создавай краткий, структурированный контент для слайдов.' 
        },
        { role: 'user', content: prompt }
      ],
      task: 'content_generation',
      temperature: 0.7
    });

    // Применение сгенерированного контента к canvas
    applyContentToCanvas(response.content);
    
  } catch (error) {
    console.error('Ошибка генерации контента:', error);
  }
};
```

### 2. **Анализ и оптимизация лайаутов**
```typescript
// Анализ текущего лайаута слайда
const analyzeLayout = async (canvasData: CanvasData) => {
  try {
    const response = await aiProviderService.createCompletion({
      messages: [
        {
          role: 'system',
          content: 'Ты эксперт по UX/UI дизайну. Анализируй лайауты слайдов и предлагай улучшения.'
        },
        {
          role: 'user',
          content: `Проанализируй этот лайаут слайда: ${JSON.stringify(canvasData)}`
        }
      ],
      task: 'layout_analysis',
      temperature: 0.5
    });

    // Применение рекомендаций
    applyLayoutSuggestions(response.content);
    
  } catch (error) {
    console.error('Ошибка анализа лайаута:', error);
  }
};
```

## 🔄 Fallback стратегии

### 1. **Автоматический fallback между моделями**
```typescript
// OpenRouter автоматически попробует fallback модели
const response = await openRouterService.createCompletion(messages, {
  model: 'openai/gpt-4o' // Основная модель
});

// Если основная модель не сработала, автоматически попробует:
// 1. anthropic/claude-3.5-sonnet
// 2. meta-llama/llama-3.1-8b-instruct
// 3. google/gemini-pro
```

### 2. **Fallback между провайдерами**
```typescript
// AI Provider Service автоматически переключается между провайдерами
const response = await aiProviderService.createCompletion({
  messages,
  task: 'content_generation'
});

// Порядок попыток:
// 1. openrouter (основной)
// 2. openai (fallback)
// 3. anthropic (fallback)
```

## 📊 Мониторинг и аналитика

### 1. **Получение статистики использования**
```typescript
import { openRouterService } from '@/services/ai/openrouter';

// Статистика использования
const usageStats = await openRouterService.getUsageStats();
console.log('Статистика OpenRouter:', usageStats);

// Информация о кредитах
const credits = await openRouterService.getCredits();
console.log('Доступные кредиты:', credits);
```

### 2. **Проверка здоровья провайдеров**
```typescript
import { aiProviderService } from '@/services/ai/ai-provider';

// Проверка здоровья всех провайдеров
const health = await aiProviderService.healthCheck();
console.log('Статус провайдеров:', health);
// {
//   openai: false,
//   openrouter: true,
//   anthropic: false
// }
```

## 🚨 Обработка ошибок

### 1. **Обработка ошибок OpenRouter**
```typescript
try {
  const response = await openRouterService.createCompletion(messages);
  // Обработка успешного ответа
} catch (error: any) {
  if (error.message.includes('rate limit')) {
    // Превышен лимит запросов
    console.log('Превышен лимит, попробуйте позже');
  } else if (error.message.includes('quota exceeded')) {
    // Превышена квота
    console.log('Превышена квота, пополните баланс');
  } else {
    // Другие ошибки
    console.error('Ошибка OpenRouter:', error.message);
  }
}
```

### 2. **Graceful degradation**
```typescript
// Если OpenRouter недоступен, переключаемся на OpenAI
try {
  const response = await aiProviderService.createCompletion({
    messages,
    task: 'content_generation'
  });
  
  if (response.metadata.fallbackUsed) {
    console.log('Использован fallback провайдер:', response.provider);
  }
  
} catch (error) {
  // Все провайдеры недоступны
  console.error('Все AI провайдеры недоступны');
  // Показать пользователю сообщение об ошибке
}
```

## 🔧 Конфигурация для продакшена

### 1. **Продакшен .env**
```bash
# OpenRouter.ai
OPENROUTER_ENABLED=true
OPENROUTER_API_KEY=sk-or-... # Продакшен ключ
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o
OPENROUTER_FALLBACK_MODELS=anthropic/claude-3.5-sonnet,meta-llama/llama-3.1-8b-instruct

# Настройки приложения
OPENROUTER_SITE_URL=https://yourdomain.com
OPENROUTER_SITE_NAME=Your App Name

# Оптимизация
OPENROUTER_AUTO_SELECTION=true
OPENROUTER_COST_OPTIMIZATION=true
OPENROUTER_LATENCY_OPTIMIZATION=true

# AI Provider
AI_DEFAULT_PROVIDER=openrouter
AI_FALLBACK_ENABLED=true
AI_FALLBACK_ORDER=openrouter,openai,anthropic
```

### 2. **Мониторинг в продакшене**
```typescript
// Логирование всех AI запросов
logger.info('AI Request', {
  provider: response.provider,
  model: response.model,
  task: request.task,
  tokens: response.usage.totalTokens,
  cost: response.metadata.cost,
  latency: response.metadata.latency,
  fallbackUsed: response.metadata.fallbackUsed
});
```

## 📚 Дополнительные ресурсы

- [OpenRouter.ai Documentation](https://openrouter.ai/docs)
- [OpenRouter API Reference](https://openrouter.ai/docs/api)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [OpenRouter Community](https://openrouter.ai/community)

## 🎯 Заключение

Интеграция OpenRouter.ai в наш проект предоставляет:

1. **🎯 Гибкость** - доступ к множеству AI моделей
2. **💰 Экономию** - автоматическая оптимизация стоимости
3. **🔄 Надежность** - автоматический fallback и переключение
4. **📊 Прозрачность** - детальная аналитика использования
5. **🔒 Контроль** - управление приватностью и логированием

OpenRouter.ai является отличной альтернативой прямому взаимодействию с OpenAI, особенно для проектов, требующих гибкости в выборе AI моделей и оптимизации затрат.
