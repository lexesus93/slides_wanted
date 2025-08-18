import axios, { AxiosInstance } from 'axios';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// =============================================================================
// ТИПЫ ДЛЯ OPENROUTER.AI
// =============================================================================

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterCompletionRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

export interface OpenRouterCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenRouterMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string;
  };
  top_provider: {
    max_completion_tokens: number;
    is_moderated: boolean;
  };
}

export interface OpenRouterProvider {
  id: string;
  name: string;
  description?: string;
  models: string[];
}

// =============================================================================
// OPENROUTER.AI СЕРВИС
// =============================================================================

export class OpenRouterService {
  private client: AxiosInstance;
  private isEnabled: boolean;
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private fallbackModels: string[];
  private appAttribution: { siteUrl: string; siteName: string };

  constructor() {
    this.isEnabled = config.ai.openrouter.enabled;
    this.apiKey = config.ai.openrouter.apiKey || '';
    this.baseUrl = config.ai.openrouter.baseUrl;
    this.defaultModel = config.ai.openrouter.defaultModel;
    this.fallbackModels = config.ai.openrouter.fallbackModels;
    this.appAttribution = config.ai.openrouter.appAttribution;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': this.appAttribution.siteUrl,
        'X-Title': this.appAttribution.siteName,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 секунд
    });

    // Логирование запросов в development режиме
    if (config.app.isDevelopment) {
      this.client.interceptors.request.use(request => {
        logger.debug('OpenRouter Request:', {
          method: request.method,
          url: request.url,
          model: request.data?.model,
          messages: request.data?.messages?.length
        });
        return request;
      });

      this.client.interceptors.response.use(
        response => {
          logger.debug('OpenRouter Response:', {
            status: response.status,
            model: response.data?.model,
            usage: response.data?.usage
          });
          return response;
        },
        error => {
          logger.error('OpenRouter Error:', {
            status: error.response?.status,
            message: error.response?.data?.error?.message || error.message,
            model: error.config?.data?.model
          });
          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Проверка доступности сервиса
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isEnabled || !this.apiKey) {
      return false;
    }

    try {
      const response = await this.client.get('/models');
      return response.status === 200;
    } catch (error) {
      logger.warn('OpenRouter service not available:', error);
      return false;
    }
  }

  /**
   * Получение списка доступных моделей
   */
  async getModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await this.client.get('/models');
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to fetch OpenRouter models:', error);
      throw new Error('Failed to fetch available models');
    }
  }

  /**
   * Получение списка провайдеров
   */
  async getProviders(): Promise<OpenRouterProvider[]> {
    try {
      const response = await this.client.get('/providers');
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to fetch OpenRouter providers:', error);
      throw new Error('Failed to fetch available providers');
    }
  }

  /**
   * Создание completion через OpenRouter
   */
  async createCompletion(
    messages: OpenRouterMessage[],
    options: Partial<OpenRouterCompletionRequest> = {}
  ): Promise<OpenRouterCompletionResponse> {
    if (!this.isEnabled || !this.apiKey) {
      throw new Error('OpenRouter service is not enabled or configured');
    }

    const request: OpenRouterCompletionRequest = {
      model: options.model || this.defaultModel,
      messages,
      max_tokens: options.max_tokens || config.ai.openai.maxTokens,
      temperature: options.temperature || config.ai.openai.temperature,
      stream: false,
      ...options
    };

    try {
      const response = await this.client.post('/chat/completions', request);
      return response.data;
    } catch (error: any) {
      logger.error('OpenRouter completion failed:', {
        error: error.response?.data?.error || error.message,
        model: request.model,
        messagesCount: messages.length
      });
      
      // Попытка fallback на другую модель
      if (this.fallbackModels.length > 0 && options.model !== this.fallbackModels[0]) {
        logger.info('Attempting fallback to alternative model');
        return this.createCompletion(messages, {
          ...options,
          model: this.fallbackModels[0]
        });
      }
      
      throw new Error(`OpenRouter completion failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Создание streaming completion
   */
  async createStreamingCompletion(
    messages: OpenRouterMessage[],
    options: Partial<OpenRouterCompletionRequest> = {}
  ): Promise<ReadableStream> {
    if (!this.isEnabled || !this.apiKey) {
      throw new Error('OpenRouter service is not enabled or configured');
    }

    const request: OpenRouterCompletionRequest = {
      model: options.model || this.defaultModel,
      messages,
      max_tokens: options.max_tokens || config.ai.openai.maxTokens,
      temperature: options.temperature || config.ai.openai.temperature,
      stream: true,
      ...options
    };

    try {
      const response = await this.client.post('/chat/completions', request, {
        responseType: 'stream'
      });

      // Преобразование в ReadableStream для совместимости с WebSocket
      return new ReadableStream({
        start(controller) {
          response.data.on('data', (chunk: Buffer) => {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                } else {
                  try {
                    const parsed = JSON.parse(data);
                    controller.enqueue(new TextEncoder().encode(JSON.stringify(parsed)));
                  } catch (e) {
                    // Игнорируем некорректные JSON
                  }
                }
              }
            }
          });

          response.data.on('end', () => {
            controller.close();
          });

          response.data.on('error', (error: Error) => {
            controller.error(error);
          });
        }
      });
    } catch (error: any) {
      logger.error('OpenRouter streaming completion failed:', error);
      throw new Error(`OpenRouter streaming failed: ${error.message}`);
    }
  }

  /**
   * Автоматический выбор оптимальной модели
   */
  async selectOptimalModel(
    task: 'content_generation' | 'layout_analysis' | 'text_summarization',
    constraints: {
      maxCost?: number;
      maxLatency?: number;
      minQuality?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<string> {
    if (!config.ai.openrouter.autoModelSelection) {
      return this.defaultModel;
    }

    try {
      const models = await this.getModels();
      
      // Фильтрация по задаче
      const suitableModels = models.filter(model => {
        // Простая эвристика для выбора модели по задаче
        if (task === 'content_generation') {
          return model.architecture.instruct_type === 'chat' && 
                 model.top_provider.max_completion_tokens >= 4000;
        }
        if (task === 'layout_analysis') {
          return model.architecture.instruct_type === 'chat' && 
                 model.context_length >= 8000;
        }
        if (task === 'text_summarization') {
          return model.architecture.instruct_type === 'chat' && 
                 model.top_provider.max_completion_tokens >= 2000;
        }
        return true;
      });

      // Сортировка по приоритету
      let sortedModels = suitableModels;

      if (config.ai.openrouter.costOptimization) {
        sortedModels = sortedModels.sort((a, b) => {
          const aCost = parseFloat(a.pricing.prompt) + parseFloat(a.pricing.completion);
          const bCost = parseFloat(b.pricing.prompt) + parseFloat(b.pricing.completion);
          return aCost - bCost;
        });
      }

      if (config.ai.openrouter.latencyOptimization) {
        // Предпочтение более быстрым моделям
        sortedModels = sortedModels.sort((a, b) => {
          // Приоритет для локальных/быстрых моделей
          const aPriority = a.id.includes('llama') || a.id.includes('gemini') ? 1 : 0;
          const bPriority = b.id.includes('llama') || b.id.includes('gemini') ? 1 : 0;
          return bPriority - aPriority;
        });
      }

      return sortedModels[0]?.id || this.defaultModel;
    } catch (error) {
      logger.warn('Failed to select optimal model, using default:', error);
      return this.defaultModel;
    }
  }

  /**
   * Получение информации о кредитах
   */
  async getCredits(): Promise<any> {
    try {
      const response = await this.client.get('/credits');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch OpenRouter credits:', error);
      throw new Error('Failed to fetch credits information');
    }
  }

  /**
   * Получение статистики использования
   */
  async getUsageStats(): Promise<any> {
    try {
      const response = await this.client.get('/generations');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch OpenRouter usage stats:', error);
      throw new Error('Failed to fetch usage statistics');
    }
  }
}

// Экспорт singleton экземпляра
export const openRouterService = new OpenRouterService();
