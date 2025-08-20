import axios from 'axios';
import { config } from '../../config';

export interface PresentationRequest {
  topic: string;
  slideCount: number;
  audience: string;
  style: string;
  language?: string;
  includeImages?: boolean;
  includeSpeakerNotes?: boolean;
  requestField?: string;
  contextField?: string;
  templateFile?: File | null;
  templateId?: string;
}

export interface SlideGenerationRequest {
  slideNumber: number;
  slideTitle: string;
  presentationContext: string;
  requestField?: string;
  contextField?: string;
  layout?: string;
}

export class AIService {
  private baseUrl: string;
  private apiKey: string;
  private provider: string;

  constructor() {
    this.provider = config.ai.defaultProvider;
    
    if (this.provider === 'openrouter') {
      this.baseUrl = 'https://openrouter.ai/api/v1';
      this.apiKey = config.ai.openrouter.apiKey || '';
    } else if (this.provider === 'openai') {
      this.baseUrl = 'https://api.openai.com/v1';
      this.apiKey = config.ai.openai.apiKey || '';
    } else {
      throw new Error(`Unsupported AI provider: ${this.provider}`);
    }
  }

  /**
   * Создает комплексный промпт для генерации презентации
   */
  private createPresentationPrompt(request: PresentationRequest): string {
    let prompt = `Создай структуру презентации на тему: "${request.topic}"

ОСНОВНЫЕ ПАРАМЕТРЫ:
- Количество слайдов: ${request.slideCount}
- Аудитория: ${request.audience}
- Стиль: ${request.style}
- Язык: ${request.language || 'русский'}`;

    // Добавляем поле запроса, если оно заполнено
    if (request.requestField?.trim()) {
      prompt += `

СТРУКТУРА ИЛИ ИДЕИ (от пользователя):
${request.requestField.trim()}

ВАЖНО: Используй эту структуру как основу для создания слайдов. Если указаны конкретные названия слайдов, используй их.`;
    }

    // Добавляем контекст, если он заполнен
    if (request.contextField?.trim()) {
      prompt += `

ДОПОЛНИТЕЛЬНЫЙ КОНТЕКСТ:
${request.contextField.trim()}

ВАЖНО: Учитывай этот контекст при создании содержания каждого слайда.`;
    }

    prompt += `

ФОРМАТ ОТВЕТА:
Верни JSON объект со следующей структурой:
{
  "title": "Название презентации",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Заголовок слайда",
      "content": ["Пункт 1", "Пункт 2", "Пункт 3"],
      "layout": "title|content|two-column|image|quote|conclusion",
      "speakerNotes": "Заметки для выступающего"
    }
  ],
  "summary": "Краткое описание презентации",
  "estimatedDuration": число_минут
}`;

    return prompt;
  }

  /**
   * Создает промпт для генерации контента слайда
   */
  private createSlideContentPrompt(request: SlideGenerationRequest): string {
    let prompt = `Создай детальный контент для слайда презентации:

СЛАЙД ${request.slideNumber}: "${request.slideTitle}"

КОНТЕКСТ ПРЕЗЕНТАЦИИ:
${request.presentationContext}`;

    // Добавляем поле запроса, если оно заполнено
    if (request.requestField?.trim()) {
      prompt += `

ПОЛЬЗОВАТЕЛЬСКИЕ ТРЕБОВАНИЯ:
${request.requestField.trim()}`;
    }

    // Добавляем контекст, если он заполнен
    if (request.contextField?.trim()) {
      prompt += `

ДОПОЛНИТЕЛЬНЫЙ КОНТЕКСТ:
${request.contextField.trim()}`;
    }

    prompt += `

МАКЕТ СЛАЙДА: ${request.layout || 'content'}

ТРЕБОВАНИЯ:
- Создай содержательный и структурированный контент
- Учитывай все предоставленные контексты и требования
- Контент должен быть релевантным заголовку слайда
- Включи практические примеры, если это уместно

ФОРМАТ ОТВЕТА:
Верни JSON объект:
{
  "slideNumber": ${request.slideNumber},
  "title": "${request.slideTitle}",
  "content": ["Основной пункт 1", "Основной пункт 2", "..."],
  "layout": "${request.layout || 'content'}",
  "speakerNotes": "Подробные заметки для выступающего",
  "suggestions": {
    "images": ["Описание изображения 1", "..."],
    "charts": ["Тип диаграммы и данные"],
    "colors": ["#цвет1", "#цвет2"],
    "fonts": ["Шрифт1", "Шрифт2"]
  }
}`;

    return prompt;
  }

  /**
   * Отправляет запрос к AI API
   */
  private async callAI(prompt: string, maxTokens: number = 2000): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: this.provider === 'openrouter' ? 'qwen/qwen2.5-vl-32b-instruct:free' : 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по созданию презентаций. Отвечай только в формате JSON, как указано в запросе.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.provider === 'openrouter' ? {
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Slides Wanted'
          } : {})
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI API call failed:', error);
      throw new Error('Failed to generate AI content');
    }
  }

  /**
   * Пытается безопасно извлечь и распарсить JSON из ответа модели
   */
  private tryParseJsonFromText(text: string): any {
    if (!text || typeof text !== 'string') return null;

    // 1) Если ответ уже чистый JSON
    try {
      return JSON.parse(text);
    } catch {}

    // 2) Попытка вытащить JSON из блока ```json ... ```
    const codeBlockMatch = text.match(/```json[\s\S]*?```/i) || text.match(/```[\s\S]*?```/i);
    if (codeBlockMatch && codeBlockMatch[0]) {
      const inner = codeBlockMatch[0].replace(/```json|```/gi, '').trim();
      try {
        return JSON.parse(inner);
      } catch {}
    }

    // 3) Попытка найти первую и последнюю скобку объекта
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {}
    }

    return null;
  }

  /**
   * Генерирует структуру презентации с использованием всех полей
   */
  async generatePresentation(request: PresentationRequest): Promise<any> {
    console.log('🤖 AI Service: Generating presentation with full context');
    console.log('- Topic:', request.topic);
    console.log('- Has request field:', !!request.requestField?.trim());
    console.log('- Has context field:', !!request.contextField?.trim());

    const prompt = this.createPresentationPrompt(request);
    console.log('📝 Generated prompt preview:', prompt.substring(0, 200) + '...');

    try {
      const aiResponse = await this.callAI(prompt, 3000);
      const parsedResponse = this.tryParseJsonFromText(aiResponse);
      if (!parsedResponse) throw new Error('AI response is not valid JSON');
      
      return {
        ...parsedResponse,
        metadata: {
          hasCustomStructure: !!request.requestField?.trim(),
          hasContextInfo: !!request.contextField?.trim(),
          hasTemplate: !!(request.templateFile || request.templateId),
          templateId: request.templateId,
          generatedAt: new Date().toISOString(),
          aiProvider: this.provider
        }
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Возвращаем fallback результат
      return this.generateFallbackPresentation(request);
    }
  }

  /**
   * Генерирует контент для конкретного слайда
   */
  async generateSlideContent(request: SlideGenerationRequest): Promise<any> {
    console.log('🤖 AI Service: Generating slide content with full context');
    console.log('- Slide:', request.slideNumber, request.slideTitle);
    console.log('- Has request field:', !!request.requestField?.trim());
    console.log('- Has context field:', !!request.contextField?.trim());

    const prompt = this.createSlideContentPrompt(request);
    
    try {
      const aiResponse = await this.callAI(prompt, 1500);
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Failed to generate slide content:', error);
      return this.generateFallbackSlideContent(request);
    }
  }

  /**
   * Fallback генерация презентации
   */
  private generateFallbackPresentation(request: PresentationRequest): any {
    const slides = [];
    
    // Анализируем поле запроса для извлечения структуры слайдов
    let customSlides: any[] = [];
    if (request.requestField?.trim()) {
      const lines = request.requestField.split('\n').filter((line: string) => line.trim());
      customSlides = lines
        .filter((line: string) => line.includes('Слайд') || line.includes('-'))
        .map((line: string, index: number) => {
          const title = line.replace(/^-\s*/, '').replace(/Слайд \d+:\s*/, '').trim();
          return {
            slideNumber: index + 1,
            title: title || `Слайд ${index + 1}`,
            content: [
              `Контент для: ${title}`,
              ...(request.contextField?.trim() ? 
                [`Учитывая контекст: ${request.contextField.substring(0, 100)}...`] : [])
            ],
            layout: 'content',
            speakerNotes: `Заметки для слайда "${title}". ${request.contextField || ''}`
          };
        });
    }

    // Если есть пользовательская структура, используем её
    if (customSlides.length > 0) {
      slides.push(...customSlides.slice(0, request.slideCount));
    } else {
      // Иначе используем стандартную генерацию
      slides.push(...Array.from({ length: request.slideCount }, (_, i) => ({
        slideNumber: i + 1,
        title: `Слайд ${i + 1}: ${request.topic}`,
        content: [
          `Контент для слайда ${i + 1}`,
          ...(request.contextField?.trim() ? 
            [`Контекст: ${request.contextField.substring(0, 100)}...`] : [])
        ],
        layout: 'content',
        speakerNotes: `Заметки для слайда ${i + 1}. ${request.contextField || ''}`
      })));
    }

    return {
      title: `Презентация: ${request.topic}`,
      slides,
      summary: `Презентация о ${request.topic}${request.requestField ? ' с пользовательской структурой' : ''}${request.contextField ? ' с дополнительным контекстом' : ''}`,
      estimatedDuration: request.slideCount * 2,
      metadata: {
        hasCustomStructure: !!request.requestField?.trim(),
        hasContextInfo: !!request.contextField?.trim(),
        hasTemplate: !!request.templateFile,
        generatedAt: new Date().toISOString(),
        aiProvider: 'fallback'
      }
    };
  }

  /**
   * Fallback генерация контента слайда
   */
  private generateFallbackSlideContent(request: SlideGenerationRequest): any {
    return {
      slideNumber: request.slideNumber,
      title: request.slideTitle,
      content: [
        `Основной контент для "${request.slideTitle}"`,
        ...(request.requestField?.trim() ? 
          [`Учитывая требования: ${request.requestField.substring(0, 100)}...`] : []),
        ...(request.contextField?.trim() ? 
          [`Контекст: ${request.contextField.substring(0, 100)}...`] : [])
      ],
      layout: request.layout || 'content',
      speakerNotes: `Заметки для "${request.slideTitle}". ${request.presentationContext}. ${request.contextField || ''}`,
      suggestions: {
        images: [],
        charts: [],
        colors: ['#007bff', '#28a745'],
        fonts: ['Arial', 'Helvetica']
      }
    };
  }
}

export const aiService = new AIService();
