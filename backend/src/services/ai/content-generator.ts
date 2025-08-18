import { aiProviderService, AIMessage } from './ai-provider';
import { logger } from '@/utils/logger';

// =============================================================================
// AI CONTENT GENERATOR SERVICE
// =============================================================================

export interface PresentationGenerationRequest {
  topic: string;
  slideCount: number;
  audience: 'business' | 'academic' | 'general' | 'technical';
  style: 'formal' | 'casual' | 'creative' | 'minimal';
  language: string;
  includeImages: boolean;
  includeCharts: boolean;
}

export interface SlideContent {
  slideNumber: number;
  title: string;
  content: string[];
  layout: 'title' | 'content' | 'two-column' | 'comparison' | 'process' | 'conclusion';
  suggestions: {
    images: string[];
    charts: string[];
    colors: string[];
    fonts: string[];
  };
}

export interface PresentationStructure {
  title: string;
  subtitle?: string;
  slides: SlideContent[];
  summary: string;
  estimatedDuration: number;
  tags: string[];
}

export class AIContentGeneratorService {
  
  /**
   * Генерация структуры презентации
   */
  async generatePresentationStructure(request: PresentationGenerationRequest): Promise<PresentationStructure> {
    const systemPrompt = this.buildSystemPrompt(request);
    
    const userPrompt = `
Создай структуру презентации на тему: "${request.topic}"

Требования:
- Количество слайдов: ${request.slideCount}
- Аудитория: ${request.audience}
- Стиль: ${request.style}
- Язык: ${request.language}
- Включить изображения: ${request.includeImages ? 'Да' : 'Нет'}
- Включить графики: ${request.includeCharts ? 'Да' : 'Нет'}

Верни структуру в формате JSON с полями:
- title: заголовок презентации
- subtitle: подзаголовок (опционально)
- slides: массив слайдов с полями slideNumber, title, content, layout, suggestions
- summary: краткое описание презентации
- estimatedDuration: примерная длительность в минутах
- tags: теги для категоризации
`;

    try {
      const response = await aiProviderService.createCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        task: 'content_generation',
        temperature: 0.7
      });

      logger.info('Presentation structure generated successfully', {
        topic: request.topic,
        slideCount: request.slideCount,
        provider: response.provider,
        model: response.model
      });

      return this.parsePresentationStructure(response.content);
    } catch (error) {
      logger.error('Failed to generate presentation structure:', error);
      throw new Error(`Failed to generate presentation structure: ${error}`);
    }
  }

  /**
   * Генерация контента для конкретного слайда
   */
  async generateSlideContent(
    slideNumber: number,
    slideTitle: string,
    context: string,
    layout: string
  ): Promise<SlideContent> {
    const systemPrompt = this.buildSlideSystemPrompt(layout);
    
    const userPrompt = `
Создай контент для слайда ${slideNumber}: "${slideTitle}"

Контекст презентации: ${context}
Тип лайаута: ${layout}

Верни контент в формате JSON с полями:
- slideNumber: номер слайда
- title: заголовок слайда
- content: массив пунктов или параграфов
- layout: тип лайаута
- suggestions: рекомендации по дизайну (изображения, цвета, шрифты)
`;

    try {
      const response = await aiProviderService.createCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        task: 'content_generation',
        temperature: 0.6
      });

      logger.info('Slide content generated successfully', {
        slideNumber,
        slideTitle,
        provider: response.provider,
        model: response.model
      });

      return this.parseSlideContent(response.content);
    } catch (error) {
      logger.error('Failed to generate slide content:', error);
      throw new Error(`Failed to generate slide content: ${error}`);
    }
  }

  /**
   * Анализ и оптимизация лайаута слайда
   */
  async analyzeAndOptimizeLayout(
    slideData: any,
    targetAudience: string
  ): Promise<{
    recommendations: string[];
    improvements: string[];
    colorScheme: string[];
    typography: string[];
  }> {
    const systemPrompt = `
Ты эксперт по UX/UI дизайну презентаций. Анализируй лайауты слайдов и предлагай улучшения для лучшего восприятия аудиторией.
`;

    const userPrompt = `
Проанализируй этот лайаут слайда для аудитории "${targetAudience}":

${JSON.stringify(slideData, null, 2)}

Предложи:
1. Рекомендации по улучшению
2. Конкретные улучшения
3. Цветовую схему
4. Типографику

Верни в формате JSON.
`;

    try {
      const response = await aiProviderService.createCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        task: 'layout_analysis',
        temperature: 0.5
      });

      return this.parseLayoutAnalysis(response.content);
    } catch (error) {
      logger.error('Failed to analyze layout:', error);
      throw new Error(`Failed to analyze layout: ${error}`);
    }
  }

  /**
   * Генерация текста для выступления
   */
  async generateSpeakerNotes(
    slideContent: SlideContent,
    presentationContext: string
  ): Promise<string> {
    const systemPrompt = `
Ты эксперт по публичным выступлениям. Создавай краткие, но информативные заметки для выступающего на основе контента слайда.
`;

    const userPrompt = `
Создай заметки для выступающего на основе этого слайда:

Заголовок: ${slideContent.title}
Контент: ${slideContent.content.join(', ')}
Контекст презентации: ${presentationContext}

Заметки должны быть:
- Краткими (2-3 предложения)
- Информативными
- Легкими для запоминания
- Помогающими объяснить ключевые моменты
`;

    try {
      const response = await aiProviderService.createCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        task: 'content_generation',
        temperature: 0.6
      });

      return response.content;
    } catch (error) {
      logger.error('Failed to generate speaker notes:', error);
      throw new Error(`Failed to generate speaker notes: ${error}`);
    }
  }

  /**
   * Построение системного промпта для презентации
   */
  private buildSystemPrompt(request: PresentationGenerationRequest): string {
    const audienceSpecific = this.getAudienceSpecificGuidelines(request.audience);
    const styleSpecific = this.getStyleSpecificGuidelines(request.style);
    
    return `
Ты эксперт по созданию презентаций. Создавай структурированный, логичный и увлекательный контент.

${audienceSpecific}

${styleSpecific}

Общие принципы:
- Каждый слайд должен иметь четкую цель
- Контент должен быть лаконичным и понятным
- Структура должна логически развивать тему
- Используй конкретные примеры и факты
- Адаптируй сложность под аудиторию

Формат ответа: строго JSON без дополнительного текста.
`;
  }

  /**
   * Построение системного промпта для слайда
   */
  private buildSlideSystemPrompt(layout: string): string {
    const layoutGuidelines = this.getLayoutGuidelines(layout);
    
    return `
Ты эксперт по созданию контента для слайдов презентаций. Создавай контент, который идеально подходит для выбранного лайаута.

${layoutGuidelines}

Принципы:
- Контент должен соответствовать типу лайаута
- Текст должен быть кратким и читаемым
- Используй маркированные списки где уместно
- Предлагай конкретные визуальные элементы

Формат ответа: строго JSON без дополнительного текста.
`;
  }

  /**
   * Получение рекомендаций для аудитории
   */
  private getAudienceSpecificGuidelines(audience: string): string {
    switch (audience) {
      case 'business':
        return `
Для бизнес-аудитории:
- Фокус на ROI и бизнес-ценности
- Используй конкретные цифры и метрики
- Структурированный подход
- Профессиональный тон
`;
      case 'academic':
        return `
Для академической аудитории:
- Подробный анализ и исследования
- Цитирование источников
- Методологический подход
- Научная точность
`;
      case 'technical':
        return `
Для технической аудитории:
- Детальные технические объяснения
- Диаграммы и схемы
- Код и алгоритмы где уместно
- Техническая терминология
`;
      default:
        return `
Для общей аудитории:
- Простой и понятный язык
- Увлекательные примеры
- Визуальные элементы
- Интерактивность
`;
    }
  }

  /**
   * Получение рекомендаций по стилю
   */
  private getStyleSpecificGuidelines(style: string): string {
    switch (style) {
      case 'formal':
        return `
Формальный стиль:
- Структурированный подход
- Профессиональный тон
- Минималистичный дизайн
- Корпоративные цвета
`;
      case 'creative':
        return `
Креативный стиль:
- Необычные лайауты
- Яркие цвета
- Инновационные подходы
- Визуальные эксперименты
`;
      case 'minimal':
        return `
Минималистичный стиль:
- Много пустого пространства
- Простые формы
- Ограниченная цветовая палитра
- Фокус на контенте
`;
      default:
        return `
Казуальный стиль:
- Дружелюбный тон
- Разнообразные элементы
- Сбалансированный дизайн
- Удобочитаемость
`;
    }
  }

  /**
   * Получение рекомендаций по лайауту
   */
  private getLayoutGuidelines(layout: string): string {
    switch (layout) {
      case 'title':
        return `
Лайаут заголовка:
- Один основной заголовок
- Подзаголовок (опционально)
- Минимальный контент
- Фокус на визуальном воздействии
`;
      case 'content':
        return `
Лайаут контента:
- Заголовок слайда
- Основной контент (списки, параграфы)
- Структурированная информация
- Читаемость
`;
      case 'two-column':
        return `
Двухколоночный лайаут:
- Левая колонка: текст/контент
- Правая колонка: изображения/графики
- Сбалансированное распределение
- Визуальная гармония
`;
      case 'comparison':
        return `
Лайаут сравнения:
- Два элемента для сравнения
- Параллельная структура
- Визуальные различия
- Четкие выводы
`;
      case 'process':
        return `
Лайаут процесса:
- Пошаговое представление
- Логическая последовательность
- Визуальные связи
- Конечный результат
`;
      case 'conclusion':
        return `
Лайаут заключения:
- Ключевые выводы
- Призыв к действию
- Финальные мысли
- Запоминающийся финал
`;
      default:
        return `
Кастомный лайаут:
- Адаптируй под контент
- Сохраняй читаемость
- Используй визуальную иерархию
- Обеспечивай баланс
`;
    }
  }

  /**
   * Парсинг структуры презентации
   */
  private parsePresentationStructure(content: string): PresentationStructure {
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || 'Untitled Presentation',
        subtitle: parsed.subtitle,
        slides: parsed.slides || [],
        summary: parsed.summary || '',
        estimatedDuration: parsed.estimatedDuration || 10,
        tags: parsed.tags || []
      };
    } catch (error) {
      logger.error('Failed to parse presentation structure:', error);
      throw new Error('Invalid presentation structure format');
    }
  }

  /**
   * Парсинг контента слайда
   */
  private parseSlideContent(content: string): SlideContent {
    try {
      const parsed = JSON.parse(content);
      return {
        slideNumber: parsed.slideNumber || 1,
        title: parsed.title || 'Untitled Slide',
        content: parsed.content || [],
        layout: parsed.layout || 'content',
        suggestions: parsed.suggestions || {
          images: [],
          charts: [],
          colors: [],
          fonts: []
        }
      };
    } catch (error) {
      logger.error('Failed to parse slide content:', error);
      throw new Error('Invalid slide content format');
    }
  }

  /**
   * Парсинг анализа лайаута
   */
  private parseLayoutAnalysis(content: string): any {
    try {
      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to parse layout analysis:', error);
      return {
        recommendations: ['Улучшить читаемость'],
        improvements: ['Добавить больше пространства'],
        colorScheme: ['#000000', '#ffffff'],
        typography: ['Arial', 'Helvetica']
      };
    }
  }
}

// Экспорт singleton экземпляра
export const aiContentGeneratorService = new AIContentGeneratorService();
