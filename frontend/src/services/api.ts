const API_BASE_URL = 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AIProvider {
  name: string;
  status: 'active' | 'inactive' | 'error';
  models: string[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

export interface AICompletionRequest {
  prompt: string;
  model?: string;
  provider?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface AICompletionBackendRequest {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  task?: string;
}

export interface AICompletionResponse {
  content: string;
  model: string;
  provider: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: number;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API Request failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Health checks
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('/health');
  }

  async aiHealthCheck(): Promise<ApiResponse<{ message: string; endpoints: string[] }>> {
    return this.request('/api/ai/status');
  }

  // AI API methods
  async getProviders(): Promise<ApiResponse<AIProvider[]>> {
    const response = await this.request('/api/ai/providers');
    
    if (response.success && response.data) {
      // Преобразуем формат backend в нужный для frontend
      const backendData = response.data as any;
      const providers: AIProvider[] = [];
      
      if (backendData.providers && Array.isArray(backendData.providers)) {
        backendData.providers.forEach((providerName: string) => {
          const health = backendData.health && backendData.health[providerName];
          providers.push({
            name: providerName,
            status: health ? 'active' : 'inactive',
            models: []
          });
        });
      }
      
      return { success: true, data: providers };
    }
    
    return { success: false, error: response.error || 'Failed to get providers' };
  }

  async getModels(): Promise<ApiResponse<AIModel[]>> {
    const response = await this.request('/api/ai/models');
    
    if (response.success && response.data) {
      // Преобразуем формат backend в нужный для frontend
      const backendData = response.data as any;
      const models: AIModel[] = [];
      
      // Обрабатываем модели из разных провайдеров
      Object.keys(backendData).forEach(provider => {
        const providerModels = backendData[provider];
        if (Array.isArray(providerModels)) {
          providerModels.forEach((model: any) => {
            models.push({
              id: model.id,
              name: model.name,
              provider: model.provider || provider,
              context_length: model.contextLength || model.context_length || 4096,
              pricing: {
                prompt: parseFloat(model.pricing?.prompt || '0'),
                completion: parseFloat(model.pricing?.completion || '0')
              }
            });
          });
        }
      });
      
      return { success: true, data: models };
    }
    
    return { success: false, error: response.error || 'Failed to get models' };
  }

  async testCompletion(request: AICompletionRequest): Promise<ApiResponse<AICompletionResponse>> {
    // Преобразуем prompt в messages массив, как ожидает backend
    const backendRequest: AICompletionBackendRequest = {
      messages: [
        { role: 'user', content: request.prompt }
      ],
      model: request.model,
      maxTokens: request.max_tokens,
      temperature: request.temperature,
      task: 'completion'
    };

    return this.request('/api/ai/complete', {
      method: 'POST',
      body: JSON.stringify(backendRequest),
    });
  }

  async generatePresentation(topic: string): Promise<ApiResponse<any>> {
    return this.request('/api/ai/presentations/generate', {
      method: 'POST',
      body: JSON.stringify({ topic }),
    });
  }
}

export const apiService = new ApiService();
