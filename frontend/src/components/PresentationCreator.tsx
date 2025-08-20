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
        includeSpeakerNotes: true,
        requestField: '',
        contextField: '',
        templateFile: null
      };
    }
    return {
      topic: '',
      slideCount: 8,
      audience: 'general',
      style: 'formal',
      language: 'ru',
      includeImages: false,
      includeSpeakerNotes: true,
      requestField: '',
      contextField: '',
      templateFile: null
    };
  });
  const [generatedPresentation, setGeneratedPresentation] = useState<Presentation | null>(null);
  const [uploadedTemplateId, setUploadedTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleInputChange = (field: keyof PresentationRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Обработчик для загрузки файла шаблона
  const handleTemplateFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.type !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      setError('Пожалуйста, выберите файл в формате .pptx');
      return;
    }
    setFormData(prev => ({ ...prev, templateFile: file }));
    setError('');

    // Автоматически загружаем шаблон на backend, чтобы получить templateId
    if (file) {
      try {
        const result = await apiService.uploadTemplate(file);
        if (result.success && result.data) {
          const anyData: any = result.data;
          const templateId = anyData.templateId || anyData.data?.templateId;
          if (templateId) {
            setUploadedTemplateId(templateId);
            try { localStorage.setItem('slides_wanted_templateId', templateId); } catch {}
          }
        }
      } catch (e) {
        console.error('Template upload failed:', e);
      }
    } else {
      setUploadedTemplateId(null);
      try { localStorage.removeItem('slides_wanted_templateId'); } catch {}
    }
  };

  // Функция для очистки файла шаблона
  const clearTemplateFile = () => {
    setFormData(prev => ({ ...prev, templateFile: null }));
  };

  // Обработчики drag & drop
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(event.dataTransfer.files);
    const file = files.find(f => f.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    
    if (file) {
      setFormData(prev => ({ ...prev, templateFile: file }));
      setError('');
    } else {
      setError('Пожалуйста, перетащите файл в формате .pptx');
    }
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
      
      // Логируем новые поля для отладки
      if (formData.requestField?.trim()) {
        console.log('Request field provided:', formData.requestField);
      }
      if (formData.contextField?.trim()) {
        console.log('Context field provided:', formData.contextField);
      }
      if (formData.templateFile) {
        console.log('Template file provided:', formData.templateFile.name);
      }
      
      // Имитируем прогресс
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Включаем templateId, если он уже загружен
      const requestPayload: any = { ...formData };
      if (uploadedTemplateId) requestPayload.templateId = uploadedTemplateId;

      const response = await apiService.generatePresentation(requestPayload);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (response.success && response.data) {
        // Используем контент, сгенерированный на backend, без подмены шаблонными слайдами
        const backendData: any = response.data;
        const backendSlides: any[] = Array.isArray(backendData.slides) ? backendData.slides : [];

        const normalizedSlides = backendSlides.map((s: any, idx: number) => {
          const rawContent = s.content;
          let contentArray: string[] = [];
          if (Array.isArray(rawContent)) {
            // Преобразуем массив, где элементы могут быть строками или объектами
            contentArray = rawContent.flatMap((item: any) => {
              if (typeof item === 'string') return [item];
              if (item == null) return [];
              if (typeof item === 'object') {
                // Поддержка иерархических списков: { text, children: [] }
                const text = item.text || item.title || item.heading || '';
                const lines = [text].filter(Boolean);
                if (Array.isArray(item.children)) {
                  const childLines = item.children
                    .map((c: any) => (typeof c === 'string' ? `  - ${c}` : (c?.text ? `  - ${c.text}` : null)))
                    .filter(Boolean) as string[];
                  return [...lines, ...childLines];
                }
                return lines;
              }
              return [String(item)];
            }).filter((l: string) => l && l.trim());
          } else if (typeof rawContent === 'string') {
            contentArray = rawContent.split('\n').filter((l) => l.trim());
          } else if (rawContent != null) {
            contentArray = [String(rawContent)].filter(Boolean);
          }

          return {
            id: String(idx + 1),
            title: s.title || `Слайд ${idx + 1}`,
            content: contentArray,
            layout: (s.layout as any) || 'content',
            notes: s.speakerNotes as string | undefined
          };
        });

        const built: Presentation = {
          id: Date.now().toString(),
          title: backendData.title || formData.topic,
          subtitle: backendData.summary ? String(backendData.summary) : `Презентация для ${formData.audience}`,
          author: 'AI Assistant',
          audience: formData.audience,
          style: formData.style as any,
          slides: normalizedSlides.length > 0 ? normalizedSlides : [
            { id: '1', title: formData.topic, content: [formData.topic], layout: 'title' as const }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setGeneratedPresentation(built);
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

      {/* Новое поле запроса */}
      <div className="form-group">
        <label>
          💡 Поле запроса
          <span className="field-description">
            Опишите идеи для презентации или уже готовую структуру слайдов
          </span>
        </label>
        <textarea
          value={formData.requestField || ''}
          onChange={(e) => handleInputChange('requestField', e.target.value)}
          placeholder="Например: 
- Слайд 1: Введение в проблему
- Слайд 2: Анализ текущего состояния
- Слайд 3: Предлагаемое решение
или просто опишите ваши идеи..."
          rows={4}
          className="textarea-field"
        />
      </div>

      {/* Новое поле контекста */}
      <div className="form-group">
        <label>
          📋 Поле контекста
          <span className="field-description">
            Дополнительная информация, которая поможет в создании презентации
          </span>
        </label>
        <textarea
          value={formData.contextField || ''}
          onChange={(e) => handleInputChange('contextField', e.target.value)}
          placeholder="Например: ключевые факты, статистика, особенности аудитории, корпоративные требования, предыдущие исследования..."
          rows={3}
          className="textarea-field"
        />
      </div>

      {/* Новое поле для загрузки шаблона */}
      <div className="form-group">
        <label>
          🎨 Шаблон презентации
          <span className="field-description">
            Загрузите файл .pptx для использования его стилей и макетов
          </span>
        </label>
        <div className="file-upload-container">
          <input
            type="file"
            accept=".pptx"
            onChange={handleTemplateFileChange}
            className="file-input"
            id="template-file"
          />
          <label 
            htmlFor="template-file" 
            className="file-upload-label"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {formData.templateFile ? (
              <span className="file-selected">
                📎 {formData.templateFile.name}
                <button 
                  type="button" 
                  onClick={clearTemplateFile}
                  className="clear-file-btn"
                  title="Удалить файл"
                >
                  ✕
                </button>
              </span>
            ) : (
              <span className="file-placeholder">
                📁 Выберите файл .pptx или перетащите сюда
              </span>
            )}
          </label>
          <div className="file-upload-note">
            💡 В будущем: поддержка .txt, .pdf файлов для анализа контекста
          </div>
        </div>
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
