import OpenAI from 'openai';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// =============================================================================
// OPENAI СЕРВИС (FALLBACK)
// =============================================================================

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAICompletionRequest {
  messages: OpenAIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface OpenAICompletionResponse {
  content: string;
  model: string;
  provider: 'openai';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    latency: number;
    cost: number;
    fallbackUsed: boolean;
  };
}

export class OpenAIService {
  private client: OpenAI | null = null;
  private isEnabled: boolean;
  private apiKey: string;
  private defaultModel: string;
  private maxTokens: number;
  private temperature: number;

  constructor() {
    this.isEnabled = !!config.ai.openai.apiKey;
    this.apiKey = config.ai.openai.apiKey || '';
    this.defaultModel = config.ai.openai.model;
    this.maxTokens = config.ai.openai.maxTokens;
    this.temperature = config.ai.openai.temperature;

    if (this.isEnabled && this.apiKey) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        organization: config.ai.openai.organization,
        dangerouslyAllowBrowser: false
      });
      
      logger.info('OpenAI service initialized successfully');
    } else {
      logger.warn('OpenAI service is not configured or disabled');
    }
  }

  /**
   * Проверка доступности сервиса
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      // Простая проверка через API
      await this.client.models.list();
      return true;
    } catch (error) {
      logger.warn('OpenAI service not available:', error);
      return false;
    }
  }

  /**
   * Создание completion через OpenAI
   */
  async createCompletion(
    messages: OpenAIMessage[],
    options: Partial<OpenAICompletionRequest> = {}
  ): Promise<OpenAICompletionResponse> {
    if (!this.isEnabled || !this.client) {
      throw new Error('OpenAI service is not enabled or configured');
    }

    const request = {
      model: options.model || this.defaultModel,
      messages,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || this.temperature,
      stream: options.stream || false
    };

    try {
      const startTime = Date.now();
      
      const response = await this.client.chat.completions.create(request);
      const latency = Date.now() - startTime;

      return {
        content: response.choices[0].message.content || '',
        model: response.model,
        provider: 'openai',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        metadata: {
          latency,
          cost: this.calculateOpenAICost(response.model, response.usage),
          fallbackUsed: false
        }
      };
    } catch (error: any) {
      logger.error('OpenAI completion failed:', {
        error: error.message,
        model: request.model,
        messagesCount: messages.length
      });
      
      throw new Error(`OpenAI completion failed: ${error.message}`);
    }
  }

  /**
   * Создание streaming completion
   */
  async createStreamingCompletion(
    messages: OpenAIMessage[],
    options: Partial<OpenAICompletionRequest> = {}
  ): Promise<ReadableStream> {
    if (!this.isEnabled || !this.client) {
      throw new Error('OpenAI service is not enabled or configured');
    }

    const request = {
      model: options.model || this.defaultModel,
      messages,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || this.temperature,
      stream: true
    };

    try {
      const stream = await this.client.chat.completions.create(request);

      // Преобразование в ReadableStream для совместимости
      return new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => {
            try {
              const data = chunk.choices[0]?.delta;
              if (data) {
                controller.enqueue(new TextEncoder().encode(JSON.stringify(data)));
              }
            } catch (e) {
              // Игнорируем некорректные данные
            }
          });

          stream.on('end', () => {
            controller.close();
          });

          stream.on('error', (error) => {
            controller.error(error);
          });
        }
      });
    } catch (error: any) {
      logger.error('OpenAI streaming completion failed:', error);
      throw new Error(`OpenAI streaming failed: ${error.message}`);
    }
  }

  /**
   * Расчет стоимости для OpenAI
   */
  private calculateOpenAICost(model: string, usage: any): number {
    // Упрощенный расчет стоимости на основе модели
    // В реальности нужно использовать актуальные цены OpenAI
    const costPer1kTokens = this.getCostPer1kTokens(model);
    return (usage.total_tokens / 1000) * costPer1kTokens;
  }

  /**
   * Получение стоимости за 1000 токенов для модели
   */
  private getCostPer1kTokens(model: string): number {
    // Примерные цены OpenAI (могут измениться)
    if (model.includes('gpt-4o')) {
      return 0.005; // $0.005 за 1K токенов
    } else if (model.includes('gpt-4')) {
      return 0.03; // $0.03 за 1K токенов
    } else if (model.includes('gpt-3.5')) {
      return 0.0015; // $0.0015 за 1K токенов
    } else {
      return 0.01; // Базовая цена по умолчанию
    }
  }

  /**
   * Получение доступных моделей OpenAI
   */
  async getAvailableModels(): Promise<string[]> {
    if (!this.isEnabled || !this.client) {
      return [];
    }

    try {
      const models = await this.client.models.list();
      return models.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id);
    } catch (error) {
      logger.warn('Failed to fetch OpenAI models:', error);
      return [];
    }
  }

  /**
   * Получение информации об использовании
   */
  async getUsageInfo(): Promise<any> {
    if (!this.isEnabled || !this.client) {
      return null;
    }

    try {
      // OpenAI не предоставляет прямой API для получения использования
      // Можно использовать billing API если доступен
      return {
        provider: 'openai',
        status: 'available',
        note: 'Usage information requires billing API access'
      };
    } catch (error) {
      logger.warn('Failed to fetch OpenAI usage info:', error);
      return null;
    }
  }

  /**
   * Проверка баланса (если доступно)
   */
  async checkBalance(): Promise<any> {
    if (!this.isEnabled || !this.client) {
      return null;
    }

    try {
      // OpenAI не предоставляет прямой API для проверки баланса
      // Можно использовать billing API если доступен
      return {
        provider: 'openai',
        status: 'available',
        note: 'Balance check requires billing API access'
      };
    } catch (error) {
      logger.warn('Failed to check OpenAI balance:', error);
      return null;
    }
  }
}

// Экспорт singleton экземпляра
export const openAIService = new OpenAIService();
