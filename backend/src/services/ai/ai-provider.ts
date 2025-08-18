import { config } from '@/config';
import { logger } from '@/utils/logger';
import { openRouterService } from './openrouter';
import { openAIService } from './openai';

// =============================================================================
// УНИФИЦИРОВАННЫЙ AI ПРОВАЙДЕР
// =============================================================================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  task?: 'content_generation' | 'layout_analysis' | 'text_summarization';
}

export interface AICompletionResponse {
  content: string;
  model: string;
  provider: string;
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

export type AIProvider = 'openai' | 'openrouter' | 'anthropic';

export class AIProviderService {
  private currentProvider: AIProvider;
  private fallbackOrder: AIProvider[];
  private fallbackEnabled: boolean;

  constructor() {
    this.currentProvider = config.ai.defaultProvider as AIProvider;
    this.fallbackOrder = config.ai.fallbackOrder as AIProvider[];
    this.fallbackEnabled = config.ai.fallbackEnabled;
  }

  /**
   * Создание completion через выбранный провайдер
   */
  async createCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    // Определяем порядок провайдеров для попытки
    const providersToTry = this.fallbackEnabled 
      ? [this.currentProvider, ...this.fallbackOrder.filter(p => p !== this.currentProvider)]
      : [this.currentProvider];

    for (const provider of providersToTry) {
      try {
        logger.info(`Attempting AI completion with provider: ${provider}`);
        
        const response = await this.createCompletionWithProvider(provider, request);
        const latency = Date.now() - startTime;
        
        return {
          ...response,
          metadata: {
            ...response.metadata,
            latency,
            fallbackUsed: provider !== this.currentProvider
          }
        };
      } catch (error: any) {
        lastError = error;
        logger.warn(`AI completion failed with provider ${provider}:`, error.message);
        
        // Если это не последний провайдер, продолжаем попытки
        if (provider !== providersToTry[providersToTry.length - 1]) {
          logger.info(`Falling back to next provider...`);
          continue;
        }
      }
    }

    // Все провайдеры не сработали
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Создание completion с конкретным провайдером
   */
  private async createCompletionWithProvider(
    provider: AIProvider, 
    request: AICompletionRequest
  ): Promise<AICompletionResponse> {
    switch (provider) {
      case 'openrouter':
        return this.createCompletionWithOpenRouter(request);
      case 'openai':
        return this.createCompletionWithOpenAI(request);
      case 'anthropic':
        return this.createCompletionWithAnthropic(request);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * OpenRouter completion
   */
  private async createCompletionWithOpenRouter(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!openRouterService.isAvailable()) {
      throw new Error('OpenRouter service is not available');
    }

    // Автоматический выбор оптимальной модели
    const optimalModel = await openRouterService.selectOptimalModel(
      request.task || 'content_generation'
    );

    const response = await openRouterService.createCompletion(
      request.messages,
      {
        model: request.model || optimalModel,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: request.stream || false
      }
    );

    return {
      content: response.choices[0].message.content,
      model: response.model,
      provider: 'openrouter',
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      },
      metadata: {
        latency: 0, // Будет вычислено в вызывающем методе
        cost: this.calculateOpenRouterCost(response.model, response.usage),
        fallbackUsed: false
      }
    };
  }

  /**
   * OpenAI completion (прямое взаимодействие)
   */
  private async createCompletionWithOpenAI(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!openAIService.isAvailable()) {
      throw new Error('OpenAI service is not available');
    }

    const response = await openAIService.createCompletion(
      request.messages,
      {
        model: request.model,
        maxTokens: request.maxTokens,
        temperature: request.temperature,
        stream: request.stream || false
      }
    );

    return {
      content: response.content,
      model: response.model,
      provider: response.provider,
      usage: response.usage,
      metadata: {
        latency: response.metadata.latency,
        cost: response.metadata.cost,
        fallbackUsed: false
      }
    };
  }

  /**
   * Anthropic completion
   */
  private async createCompletionWithAnthropic(request: AICompletionRequest): Promise<AICompletionResponse> {
    // Здесь будет интеграция с Anthropic SDK
    // Пока что заглушка
    throw new Error('Anthropic integration not implemented yet');
  }

  /**
   * Расчет стоимости для OpenRouter
   */
  private calculateOpenRouterCost(model: string, usage: any): number {
    // Упрощенный расчет стоимости
    // В реальности нужно получать актуальные цены из API
    const baseCostPerToken = 0.00001; // $0.00001 за токен
    return usage.total_tokens * baseCostPerToken;
  }

  /**
   * Переключение на другой провайдер
   */
  setProvider(provider: AIProvider): void {
    if (['openai', 'openrouter', 'anthropic'].includes(provider)) {
      this.currentProvider = provider;
      logger.info(`AI provider switched to: ${provider}`);
    } else {
      throw new Error(`Invalid AI provider: ${provider}`);
    }
  }

  /**
   * Получение текущего провайдера
   */
  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Получение доступных провайдеров
   */
  async getAvailableProviders(): Promise<AIProvider[]> {
    const available: AIProvider[] = [];

    // Проверяем OpenRouter
    if (await openRouterService.isAvailable()) {
      available.push('openrouter');
    }

    // Проверяем OpenAI
    if (await openAIService.isAvailable()) {
      available.push('openai');
    }

    // TODO: Добавить проверки для Anthropic
    // available.push('anthropic');

    return available;
  }

  /**
   * Получение информации о моделях
   */
  async getAvailableModels(): Promise<any[]> {
    try {
      if (await openRouterService.isAvailable()) {
        const models = await openRouterService.getModels();
        return models.map(model => ({
          id: model.id,
          name: model.name,
          provider: 'openrouter',
          contextLength: model.context_length,
          pricing: model.pricing
        }));
      }
    } catch (error) {
      logger.warn('Failed to fetch OpenRouter models:', error);
    }

    return [];
  }

  /**
   * Получение статистики использования
   */
  async getUsageStats(): Promise<any> {
    const stats: any = {};

    try {
      if (await openRouterService.isAvailable()) {
        stats.openrouter = await openRouterService.getUsageStats();
      }
    } catch (error) {
      logger.warn('Failed to fetch OpenRouter usage stats:', error);
    }

    return stats;
  }

  /**
   * Проверка здоровья всех провайдеров
   */
  async healthCheck(): Promise<Record<AIProvider, boolean>> {
    const health: Record<AIProvider, boolean> = {
      openai: false,
      openrouter: false,
      anthropic: false
    };

    // Проверяем OpenRouter
    try {
      health.openrouter = await openRouterService.isAvailable();
    } catch (error) {
      health.openrouter = false;
    }

    // Проверяем OpenAI
    try {
      health.openai = await openAIService.isAvailable();
    } catch (error) {
      health.openai = false;
    }

    // TODO: Добавить проверки для Anthropic

    return health;
  }
}

// Экспорт singleton экземпляра
export const aiProviderService = new AIProviderService();
