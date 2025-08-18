import React, { useState, useEffect } from 'react';
import { apiService, AIProvider, AIModel, AICompletionResponse } from '../services/api';
import './AITester.css';

interface AITesterProps {
  onClose: () => void;
}

const AITester: React.FC<AITesterProps> = ({ onClose }) => {
  const [providers, setProviders] = useState<AIProvider[]>([
    { name: 'openrouter', status: 'active', models: [] },
    { name: 'openai', status: 'active', models: [] }
  ]);
  const [models, setModels] = useState<AIModel[]>([
    { 
      id: 'qwen/qwen2.5-vl-32b-instruct:free', 
      name: 'Qwen2.5-VL 32B Instruct (Free)', 
      provider: 'openrouter',
      context_length: 32768,
      pricing: { prompt: 0.0, completion: 0.0 }
    },
    { 
      id: 'openai/gpt-oss-20b:free', 
      name: 'GPT OSS 20B (Free)', 
      provider: 'openrouter',
      context_length: 8192,
      pricing: { prompt: 0.0, completion: 0.0 }
    }
  ]);
  const [selectedProvider, setSelectedProvider] = useState<string>('openrouter');
  const [selectedModel, setSelectedModel] = useState<string>('qwen/qwen2.5-vl-32b-instruct:free');
  const [prompt, setPrompt] = useState<string>('Привет! Как дела?');
  const [maxTokens, setMaxTokens] = useState<number>(100);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AICompletionResponse | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    console.log('AITester: Компонент загружен, пытаемся загрузить актуальные данные...');
    loadProviders();
    loadModels();
  }, []);

  const loadProviders = async () => {
    try {
      console.log('AITester: Загружаем провайдеров...');
      const response = await apiService.getProviders();
      console.log('AITester: Ответ провайдеров:', response);
      
      if (response.success && response.data && response.data.length > 0) {
        setProviders(response.data);
        setSelectedProvider(response.data[0].name);
        console.log('AITester: Провайдеры загружены успешно');
      } else {
        console.log('AITester: Используем базовые провайдеры');
      }
    } catch (error) {
      console.error('AITester: Ошибка загрузки провайдеров, используем базовые:', error);
    }
  };

  const loadModels = async () => {
    try {
      console.log('AITester: Загружаем модели...');
      const response = await apiService.getModels();
      console.log('AITester: Ответ моделей:', response);
      
      if (response.success && response.data && response.data.length > 0) {
        setModels(response.data);
        setSelectedModel(response.data[0].id);
        console.log('AITester: Модели загружены успешно');
      } else {
        console.log('AITester: Используем базовые модели');
      }
    } catch (error) {
      console.error('AITester: Ошибка загрузки моделей, используем базовые:', error);
    }
  };

  const handleTest = async () => {
    console.log('AITester: Начинаем тестирование AI...');
    
    if (!prompt.trim()) {
      setError('Введите текст для тестирования');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('AITester: Отправляем запрос:', {
        prompt,
        model: selectedModel,
        provider: selectedProvider,
        max_tokens: maxTokens,
        temperature: temperature,
      });

      const response = await apiService.testCompletion({
        prompt,
        model: selectedModel,
        provider: selectedProvider,
        max_tokens: maxTokens,
        temperature: temperature,
      });

      console.log('AITester: Получен ответ:', response);
      setLoading(false);

      if (response.success && response.data) {
        // Backend возвращает данные в поле data
        const aiResponse = response.data;
        const formattedResult: AICompletionResponse = {
          content: aiResponse.content,
          model: aiResponse.model,
          provider: aiResponse.provider,
          usage: {
            prompt_tokens: aiResponse.usage?.promptTokens || 0,
            completion_tokens: aiResponse.usage?.completionTokens || 0,
            total_tokens: aiResponse.usage?.totalTokens || 0
          },
          cost: aiResponse.metadata?.cost
        };
        setResult(formattedResult);
      } else {
        setError(response.error || 'Ошибка при выполнении запроса');
      }
    } catch (error) {
      console.error('AITester: Критическая ошибка тестирования:', error);
      setLoading(false);
      setError('Критическая ошибка при выполнении запроса');
    }
  };

  const filteredModels = models.filter(model => 
    !selectedProvider || model.provider === selectedProvider
  );

  console.log('AITester: Рендерим компонент, providers:', providers, 'models:', models);

  return (
    <div className="ai-tester-overlay">
      <div className="ai-tester">
        <div className="ai-tester-header">
          <h2>🧪 Тестирование AI API</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="ai-tester-content">
          <div className="form-group">
            <label>Провайдер AI:</label>
            <select 
              value={selectedProvider} 
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              {providers.map(provider => (
                <option key={provider.name} value={provider.name}>
                  {provider.name} ({provider.status})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Модель:</label>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {filteredModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} (ctx: {model.context_length})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Max Tokens:</label>
              <input 
                type="number" 
                value={maxTokens} 
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                min="1"
                max="4000"
              />
            </div>
            <div className="form-group">
              <label>Temperature:</label>
              <input 
                type="number" 
                value={temperature} 
                onChange={(e) => setTemperature(Number(e.target.value))}
                min="0"
                max="2"
                step="0.1"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Промпт:</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Введите ваш промпт здесь..."
            />
          </div>

          <button 
            className="test-btn" 
            onClick={handleTest} 
            disabled={loading}
          >
            {loading ? '⏳ Выполняется...' : '🚀 Тестировать'}
          </button>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          {result && (
            <div className="result-section">
              <h3>📊 Результат:</h3>
              <div className="result-meta">
                <span>Модель: {result.model}</span>
                <span>Провайдер: {result.provider}</span>
                <span>Токены: {result.usage.total_tokens}</span>
                {result.cost && <span>Стоимость: ${result.cost.toFixed(6)}</span>}
              </div>
              <div className="result-content">
                {result.content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITester;
