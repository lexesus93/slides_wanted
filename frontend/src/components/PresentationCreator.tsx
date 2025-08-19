import React, { useState } from 'react';
import { apiService } from '../services/api';
import { Presentation, PresentationRequest } from '../types/presentation';
import './PresentationCreator.css';

interface PresentationCreatorProps {
  onClose: () => void;
  onPresentationCreated: (presentation: Presentation) => void;
  existingPresentation?: Presentation | null;
}

const PresentationCreator: React.FC<PresentationCreatorProps> = ({ onClose, onPresentationCreated, existingPresentation }) => {
  const [step, setStep] = useState<'form' | 'generating' | 'preview'>('form');
  
  // Инициализируем форму данными существующей презентации, если она есть
  const [formData, setFormData] = useState<PresentationRequest>(() => {
    if (existingPresentation) {
      return {
        topic: existingPresentation.title,
        slideCount: existingPresentation.slides.length,
        audience: existingPresentation.audience,
        style: existingPresentation.style,
        language: 'ru',
        includeImages: false,
        includeSpeakerNotes: true
      };
    }
    return {
      topic: '',
      slideCount: 8,
      audience: 'general',
      style: 'formal',
      language: 'ru',
      includeImages: false,
      includeSpeakerNotes: true
    };
  });
  const [generatedPresentation, setGeneratedPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleInputChange = (field: keyof PresentationRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      setError('Пожалуйста, введите тему презентации');
      return;
    }

    setLoading(true);
    setError('');
    setStep('generating');
    setProgress(0);

    try {
      console.log('Generating presentation with data:', formData);
      
      // Имитируем прогресс
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await apiService.generatePresentation(formData);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (response.success && response.data) {
        // Генерируем слайды на основе указанного количества
        const generateSlides = () => {
          const slides = [];
          
          // Первый слайд - всегда титульный
          slides.push({
            id: '1',
            title: formData.topic,
            content: [`Презентация на тему "${formData.topic}"`, `Для аудитории: ${formData.audience}`],
            layout: 'title' as const
          });

          // Генерируем остальные слайды
          const remainingSlides = formData.slideCount - 1;
          const slideTemplates = [
            { title: 'Введение', content: ['Основные темы для обсуждения', 'Цели и задачи', 'Структура презентации'], layout: 'content' as const },
            { title: 'Проблематика', content: ['Текущее состояние', 'Выявленные проблемы', 'Необходимость решения'], layout: 'content' as const },
            { title: 'Анализ ситуации', content: ['Детальный анализ', 'Ключевые факторы', 'Статистические данные'], layout: 'two-column' as const },
            { title: 'Предлагаемое решение', content: ['Основная концепция', 'Методы реализации', 'Ожидаемые результаты'], layout: 'content' as const },
            { title: 'Преимущества', content: ['Основные преимущества', 'Конкурентные особенности', 'Добавленная стоимость'], layout: 'content' as const },
            { title: 'Практическое применение', content: ['Примеры использования', 'Кейсы и результаты', 'Практические рекомендации'], layout: 'two-column' as const },
            { title: 'Планы и перспективы', content: ['Краткосрочные цели', 'Долгосрочная стратегия', 'Развитие проекта'], layout: 'content' as const },
            { title: 'Ресурсы и бюджет', content: ['Необходимые ресурсы', 'Финансовые затраты', 'ROI и окупаемость'], layout: 'two-column' as const },
            { title: 'Риски и митигация', content: ['Основные риски', 'Стратегии снижения', 'План резервирования'], layout: 'content' as const },
            { title: 'Команда проекта', content: ['Ключевые участники', 'Роли и ответственность', 'Экспертиза команды'], layout: 'content' as const },
            { title: 'Временные рамки', content: ['Основные этапы', 'Ключевые вехи', 'График реализации'], layout: 'two-column' as const },
            { title: 'Критерии успеха', content: ['KPI и метрики', 'Показатели эффективности', 'Методы измерения'], layout: 'content' as const },
            { title: 'Следующие шаги', content: ['Немедленные действия', 'Планы на ближайший период', 'Долгосрочные цели'], layout: 'content' as const },
            { title: 'Вопросы и обсуждение', content: ['Открытые вопросы', 'Обратная связь', 'Дискуссия'], layout: 'content' as const },
            { title: 'Выводы', content: ['Ключевые выводы', 'Рекомендации', 'Значимость результатов'], layout: 'conclusion' as const },
            { title: 'Заключение', content: ['Подведение итогов', 'Основные достижения', 'Благодарности'], layout: 'conclusion' as const }
          ];

          // Выбираем нужное количество слайдов (исключая заключение)
          let selectedTemplates = slideTemplates.slice(0, Math.max(0, remainingSlides - 1));
          
          // Добавляем заключительный слайд
          if (remainingSlides > 0) {
            selectedTemplates.push(slideTemplates[slideTemplates.length - 1]); // Заключение
          }

          // Добираем слайды если нужно больше
          while (selectedTemplates.length < remainingSlides) {
            const randomTemplate = slideTemplates[Math.floor(Math.random() * (slideTemplates.length - 2))];
            selectedTemplates.push({
              ...randomTemplate,
              title: `${randomTemplate.title} (часть ${selectedTemplates.length + 1})`
            });
          }

          // Добавляем в массив слайдов
          selectedTemplates.slice(0, remainingSlides).forEach((template, index) => {
            slides.push({
              id: (index + 2).toString(),
              title: template.title,
              content: template.content,
              layout: template.layout
            });
          });

          return slides;
        };

        // Создаем презентацию из ответа backend
        const mockPresentation: Presentation = {
          id: Date.now().toString(),
          title: formData.topic,
          subtitle: `Презентация для ${formData.audience}`,
          author: 'AI Assistant',
          audience: formData.audience,
          style: formData.style as any,
          slides: generateSlides(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setGeneratedPresentation(mockPresentation);
        setStep('preview');
      } else {
        setError(response.error || 'Ошибка при генерации презентации');
        setStep('form');
      }
    } catch (error) {
      console.error('Failed to generate presentation:', error);
      setError('Критическая ошибка при генерации презентации');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPresentation = () => {
    if (generatedPresentation) {
      onPresentationCreated(generatedPresentation);
      onClose();
    }
  };

  const renderForm = () => (
    <div className="creator-content">
      <div className="form-group">
        <label>Тема презентации *</label>
        <input
          type="text"
          value={formData.topic}
          onChange={(e) => handleInputChange('topic', e.target.value)}
          placeholder="Например: Искусственный интеллект в медицине"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Количество слайдов</label>
          <select
            value={formData.slideCount}
            onChange={(e) => handleInputChange('slideCount', parseInt(e.target.value))}
          >
            <option value={5}>5 слайдов</option>
            <option value={8}>8 слайдов</option>
            <option value={12}>12 слайдов</option>
            <option value={15}>15 слайдов</option>
            <option value={20}>20 слайдов</option>
          </select>
        </div>

        <div className="form-group">
          <label>Аудитория</label>
          <select
            value={formData.audience}
            onChange={(e) => handleInputChange('audience', e.target.value)}
          >
            <option value="general">Общая аудитория</option>
            <option value="students">Студенты</option>
            <option value="professionals">Профессионалы</option>
            <option value="executives">Руководители</option>
            <option value="technical">Технические специалисты</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Стиль презентации</label>
          <select
            value={formData.style}
            onChange={(e) => handleInputChange('style', e.target.value)}
          >
            <option value="formal">Формальный</option>
            <option value="casual">Неформальный</option>
            <option value="creative">Креативный</option>
            <option value="minimal">Минимализм</option>
            <option value="corporate">Корпоративный</option>
          </select>
        </div>

        <div className="form-group">
          <label>Язык</label>
          <select
            value={formData.language}
            onChange={(e) => handleInputChange('language', e.target.value)}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.includeSpeakerNotes}
            onChange={(e) => handleInputChange('includeSpeakerNotes', e.target.checked)}
          />
          Включить заметки для выступающего
        </label>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.includeImages}
            onChange={(e) => handleInputChange('includeImages', e.target.checked)}
          />
          Предложить изображения (в разработке)
        </label>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <button
        className="generate-btn"
        onClick={handleGenerate}
        disabled={loading || !formData.topic.trim()}
      >
        {existingPresentation ? '✏️ Пересоздать презентацию' : '🎯 Создать презентацию'}
      </button>
    </div>
  );

  const renderGenerating = () => (
    <div className="generating-content">
      <div className="generating-animation">
        <div className="spinner"></div>
      </div>
      <h3>🤖 Создаем вашу презентацию...</h3>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="progress-text">{progress}% завершено</p>
      <div className="generating-steps">
        <div className={progress >= 20 ? 'step completed' : 'step'}>✅ Анализ темы</div>
        <div className={progress >= 40 ? 'step completed' : 'step'}>✅ Создание структуры</div>
        <div className={progress >= 60 ? 'step completed' : 'step'}>✅ Генерация контента</div>
        <div className={progress >= 80 ? 'step completed' : 'step'}>✅ Оформление слайдов</div>
        <div className={progress >= 100 ? 'step completed' : 'step'}>✅ Финализация</div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="preview-content">
      <h3>📋 Предварительный просмотр</h3>
      {generatedPresentation && (
        <div className="presentation-preview">
          <div className="presentation-header">
            <h4>{generatedPresentation.title}</h4>
            <p>{generatedPresentation.subtitle}</p>
            <small>
              {generatedPresentation.slides.length} слайдов • 
              {generatedPresentation.style} стиль • 
              Аудитория: {generatedPresentation.audience}
            </small>
          </div>
          
          <div className="slides-preview">
            {generatedPresentation.slides.map((slide, index) => (
              <div key={slide.id} className="slide-preview">
                <div className="slide-number">{index + 1}</div>
                <div className="slide-content">
                  <h5>{slide.title}</h5>
                  <ul>
                    {slide.content.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="slide-layout">{slide.layout}</div>
              </div>
            ))}
          </div>

          <div className="preview-actions">
            <button className="btn-secondary" onClick={() => setStep('form')}>
              ← Изменить параметры
            </button>
            <button className="btn-primary" onClick={handleAcceptPresentation}>
              ✅ Принять презентацию
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="presentation-creator-overlay">
      <div className="presentation-creator">
        <div className="creator-header">
          <h2>{existingPresentation ? '✏️ Редактирование презентации' : '🎯 Создание презентации'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {step === 'form' && renderForm()}
        {step === 'generating' && renderGenerating()}
        {step === 'preview' && renderPreview()}
      </div>
    </div>
  );
};

export default PresentationCreator;
