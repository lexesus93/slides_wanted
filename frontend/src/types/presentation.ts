export interface Slide {
  id: string;
  title: string;
  content: string[];
  layout: 'title' | 'content' | 'two-column' | 'image' | 'quote' | 'conclusion';
  notes?: string;
  backgroundImage?: string;
  backgroundColor?: string;
}

export interface Presentation {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  audience: string;
  style: 'formal' | 'casual' | 'creative' | 'minimal' | 'corporate';
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}

export interface PresentationRequest {
  topic: string;
  slideCount: number;
  audience: string;
  style: string;
  language?: string;
  includeImages?: boolean;
  includeSpeakerNotes?: boolean;
  // Новые поля
  requestField?: string;        // Поле запроса - идеи или структура слайдов
  contextField?: string;        // Поле контекста - дополнительная информация
  templateFile?: File | null;   // Файл шаблона презентации
}

export interface PresentationGenerationResponse {
  presentation: Presentation;
  generationTime: number;
  tokensUsed: number;
  cost?: number;
}
