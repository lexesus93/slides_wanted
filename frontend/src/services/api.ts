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
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`API Request: ${options?.method || 'GET'} ${url}`);
      if (options?.body) {
        console.log('API Request Body:', options.body);
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      console.log(`API Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      
      // Если backend уже возвращает объект с success и data, используем его напрямую
      if (data && typeof data === 'object' && 'success' in data) {
        return data;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('API Request failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Template methods
  async uploadTemplate(file: File): Promise<ApiResponse<{ templateId: string; name: string }>> {
    try {
      const url = `${API_BASE_URL}/api/ai/templates/upload`;
      const formData = new FormData();
      formData.append('template', file);

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Template upload failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getTemplateDetails(templateId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/ai/templates/${encodeURIComponent(templateId)}`);
  }

  // Health checks
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('/health');
  }

  async aiHealthCheck(): Promise<ApiResponse<{ message: string; endpoints: string[] }>> {
    const res = await this.request('/api/ai/status');
    if (!res.success) {
      // Fallback: some builds expose only /api/ai/health
      const fallback = await this.request('/api/ai/health');
      if (fallback.success) {
        return { success: true, data: { message: 'AI health OK', endpoints: [] } };
      }
    }
    return res;
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

  async generatePresentation(request: any): Promise<ApiResponse<any>> {
    return this.request('/api/ai/presentations/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateSlideContent(
    slideNumber: number,
    slideTitle: string, 
    presentationContext: string,
    requestField?: string,
    contextField?: string,
    layout: string = 'content'
  ): Promise<ApiResponse<any>> {
    return this.request('/api/ai/slides/generate', {
      method: 'POST',
      body: JSON.stringify({ 
        slideNumber,
        slideTitle, 
        presentationContext,
        requestField,
        contextField,
        layout
      }),
    });
  }

  async generateSpeakerNotes(
    slideContent: any, 
    presentationContext: string,
    requestField?: string,
    contextField?: string
  ): Promise<ApiResponse<any>> {
    return this.request('/api/ai/speaker-notes/generate', {
      method: 'POST',
      body: JSON.stringify({ 
        slideContent, 
        presentationContext,
        requestField,
        contextField
      }),
    });
  }

  // Export methods
  async exportToPPTX(presentation: any, templateId?: string): Promise<ApiResponse<{ downloadUrl: string; fileName: string; fileSize: number; format: string }>> {
    console.log('API Service: Sending PPTX export request:', { presentation, templateId });
    const payload: any = { presentation };
    if (templateId) payload.templateId = templateId;
    const result = await this.request<{ downloadUrl: string; fileName: string; fileSize: number; format: string }>('/api/ai/export/pptx', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log('API Service: PPTX export result:', result);
    return result;
  }

  async exportToPDF(presentation: any): Promise<ApiResponse<{ downloadUrl: string; fileName: string; fileSize: number; format: string }>> {
    return this.request<{ downloadUrl: string; fileName: string; fileSize: number; format: string }>('/api/ai/export/pdf', {
      method: 'POST',
      body: JSON.stringify({ presentation }),
    });
  }

  // Download file utility
  downloadFile = async (url: string, filename: string): Promise<void> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();

// Импортируем типы презентаций
export type { Presentation, PresentationRequest, PresentationGenerationResponse } from '../types/presentation';
