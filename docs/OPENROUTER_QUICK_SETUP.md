# ⚡ Быстрая настройка OpenRouter.ai

## 🎯 За 2 минуты

### 1. **Получите API ключ**
- Зарегистрируйтесь на [OpenRouter.ai](https://openrouter.ai/)
- Создайте API ключ в [API Keys](https://openrouter.ai/keys)
- Скопируйте ключ (начинается с `sk-or-`)

### 2. **Настройте .env файл**
```bash
# Включить OpenRouter
OPENROUTER_ENABLED=true
OPENROUTER_API_KEY=sk-or-your-actual-key-here

# Использовать OpenRouter как основной провайдер
AI_DEFAULT_PROVIDER=openrouter
```

### 3. **Готово! 🎉**
Теперь ваш проект будет использовать OpenRouter.ai вместо прямого OpenAI API.

## 🔄 Что изменится

- **Модели**: Доступ к 100+ AI моделям
- **Стоимость**: Автоматическая оптимизация
- **Fallback**: Автоматическое переключение при сбоях
- **Мониторинг**: Детальная аналитика использования

## 📚 Примеры использования

```typescript
// Автоматически использует OpenRouter
const response = await aiProviderService.createCompletion({
  messages: [
    { role: 'user', content: 'Создай слайд о ИИ' }
  ],
  task: 'content_generation'
});

console.log('Модель:', response.model);        // openai/gpt-4o
console.log('Провайдер:', response.provider);  // openrouter
console.log('Стоимость:', response.metadata.cost);
```

## 🆘 Нужна помощь?

- [Полная документация](./OPENROUTER_INTEGRATION.md)
- [Примеры кода](./OPENROUTER_INTEGRATION.md#📚-примеры-использования)
- [Настройка .env](./ENV_SETUP.md)

---

**OpenRouter.ai = Гибкость + Экономия + Надежность** 🚀
