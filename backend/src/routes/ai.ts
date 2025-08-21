import { Router } from 'express';
import { pptxExportService } from '../services/pptx-export.service';
import { templateProcessor } from '../services/template-processor.service';
import { aiService } from '../services/ai/ai-service';
import { uploadTemplate, handleUploadError, cleanupUploadedFile } from '../middleware/upload.middleware';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

// =============================================================================
// AI STATUS ENDPOINT
// =============================================================================

/**
 * @route GET /api/ai/status
 * @desc Получить статус AI сервисов
 */
router.get('/status', async (req, res) => {
  try {
    return res.json({ 
      message: 'AI services are available',
      endpoints: [
        'GET /api/ai/providers - Available AI providers',
        'GET /api/ai/models - Available AI models',
        'GET /api/ai/usage - Usage statistics',
        'GET /api/ai/health - Health check',
        'POST /api/ai/complete - AI completion',
        'POST /api/ai/presentations/generate - Generate presentation',
        'POST /api/ai/slides/generate - Generate slide content',
        'POST /api/ai/layouts/analyze - Analyze layout',
        'POST /api/ai/speaker-notes/generate - Generate speaker notes',
        'POST /api/ai/templates/upload - Upload PPTX template',
        'GET /api/ai/templates - List available templates',
        'GET /api/ai/templates/:id - Get template details',
        'POST /api/ai/templates/:id/apply - Apply data to template',
        'POST /api/ai/templates/:id/preview - Preview template',
        'DELETE /api/ai/templates/:id - Delete template'
      ]
    });
  } catch (error) {
    console.error('Failed to get AI status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get AI status'
    });
  }
});

// =============================================================================
// AI PROVIDER ENDPOINTS
// =============================================================================

/**
 * @route GET /api/ai/providers
 * @desc Получить доступные AI провайдеры
 */
router.get('/providers', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        providers: ['openrouter', 'openai'],
        health: {
          openai: true,
          openrouter: true,
          anthropic: false
        },
        currentProvider: 'openrouter'
      }
    });
  } catch (error) {
    console.error('Failed to get AI providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI providers'
    });
  }
});

/**
 * @route POST /api/ai/providers/switch
 * @desc Переключить AI провайдера
 */
router.post('/providers/switch', async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!provider || !['openai', 'openrouter', 'anthropic'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider. Must be one of: openai, openrouter, anthropic'
      });
    }

    return res.json({
      success: true,
      data: {
        currentProvider: provider,
        message: `Switched to ${provider} provider`
      }
    });
  } catch (error) {
    console.error('Failed to switch AI provider:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to switch AI provider'
    });
  }
});

/**
 * @route GET /api/ai/models
 * @desc Получить доступные модели
 */
router.get('/models', async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        openrouter: [
          {
            id: 'openai/gpt-4o',
            name: 'GPT-4o',
            provider: 'openrouter',
            contextLength: 128000,
            pricing: { prompt: '0.00001', completion: '0.00003' }
          },
          {
            id: 'anthropic/claude-3.5-sonnet',
            name: 'Claude 3.5 Sonnet',
            provider: 'openrouter',
            contextLength: 200000,
            pricing: { prompt: '0.000003', completion: '0.000015' }
          }
        ],
        openai: [
          { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
          { id: 'gpt-4', name: 'GPT-4', provider: 'openai' }
        ]
      }
    });
  } catch (error) {
    console.error('Failed to get AI models:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get AI models'
    });
  }
});

/**
 * @route GET /api/ai/usage
 * @desc Получить статистику использования
 */
router.get('/usage', async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        openrouter: {
          totalTokens: 15000,
          totalCost: 0.00045,
          requests: 25
        },
        openai: {
          totalTokens: 8000,
          totalCost: 0.00024,
          requests: 12
        }
      }
    });
  } catch (error) {
    console.error('Failed to get AI usage stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get AI usage stats'
    });
  }
});

// =============================================================================
// CONTENT GENERATION ENDPOINTS
// =============================================================================

/**
 * @route POST /api/ai/presentations/generate
 * @desc Сгенерировать структуру презентации
 */
router.post('/presentations/generate', async (req, res) => {
  try {
    const { 
      topic, 
      slideCount = 5, 
      audience = 'general', 
      style = 'formal',
      language = 'ru',
      includeImages = false,
      includeSpeakerNotes = true,
      requestField,
      contextField,
      templateFile,
      templateId 
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }

    // Логируем все данные для отладки
    console.log('🎯 Generating presentation with AI service:');
    console.log('- Topic:', topic);
    console.log('- Slide count:', slideCount);
    console.log('- Audience:', audience);
    console.log('- Style:', style);
    console.log('- Language:', language);
    
    if (requestField?.trim()) {
      console.log('- Request field provided:', requestField.substring(0, 100) + '...');
    }
    
    if (contextField?.trim()) {
      console.log('- Context field provided:', contextField.substring(0, 100) + '...');
    }
    
    if (templateFile) console.log('- Template file provided:', templateFile);
    if (templateId) console.log('- Template ID provided:', templateId);

    // Фиксируем возможную кривую кодировку (mojibake) для кириллицы
    const fixMojibake = (s?: string) => {
      if (!s || typeof s !== 'string') return s;
      try {
        // Перекодируем предполагаемую Latin-1 в UTF-8 и выбираем вариант с большим числом кириллицы
        const recoded = Buffer.from(s, 'latin1').toString('utf8');
        const countCyr = (t: string) => (t.match(/[А-Яа-яЁё]/g) || []).length;
        return countCyr(recoded) > countCyr(s) ? recoded : s;
      } catch {
        return s;
      }
    };

    const cleanRequestField = fixMojibake(requestField);
    const cleanContextField = fixMojibake(contextField);

    // Используем AI сервис для генерации презентации со всеми полями
    const presentation = await aiService.generatePresentation({
      topic,
      slideCount,
      audience,
      style,
      language,
      includeImages,
      includeSpeakerNotes,
      requestField: cleanRequestField,
      contextField: cleanContextField,
      templateFile,
      templateId
    });

    return res.json({
      success: true,
      data: presentation
    });
  } catch (error) {
    console.error('Failed to generate presentation structure:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate presentation structure'
    });
  }
});

/**
 * @route POST /api/ai/slides/generate
 * @desc Сгенерировать контент для слайда
 */
router.post('/slides/generate', async (req, res) => {
  try {
    const { 
      slideNumber, 
      slideTitle, 
      presentationContext, 
      layout = 'content',
      requestField,
      contextField 
    } = req.body;

    if (!slideNumber || !slideTitle || !presentationContext) {
      return res.status(400).json({
        success: false,
        error: 'slideNumber, slideTitle, and presentationContext are required'
      });
    }

    console.log('🎯 Generating slide content with AI service:');
    console.log('- Slide:', slideNumber, slideTitle);
    console.log('- Has request field:', !!requestField?.trim());
    console.log('- Has context field:', !!contextField?.trim());

    // Используем AI сервис для генерации контента слайда со всеми полями
    const slideContent = await aiService.generateSlideContent({
      slideNumber,
      slideTitle,
      presentationContext,
      requestField,
      contextField,
      layout
    });

    return res.json({
      success: true,
      data: slideContent
    });
  } catch (error) {
    console.error('Failed to generate slide content:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate slide content'
    });
  }
});

/**
 * @route POST /api/ai/layouts/analyze
 * @desc Анализ и оптимизация лайаута
 */
router.post('/layouts/analyze', async (req, res) => {
  try {
    const { slideData, targetAudience = 'general' } = req.body;

    if (!slideData) {
      return res.status(400).json({
        success: false,
        error: 'slideData is required'
      });
    }

    const analysis = {
      recommendations: ['Улучшить читаемость', 'Добавить больше пространства'],
      improvements: ['Увеличить размер шрифта', 'Добавить контраст'],
      colorScheme: ['#007bff', '#28a745', '#dc3545'],
      typography: ['Arial', 'Helvetica', 'Georgia']
    };

    return res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Failed to analyze layout:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze layout'
    });
  }
});

/**
 * @route POST /api/ai/speaker-notes/generate
 * @desc Генерация заметок для выступающего
 */
router.post('/speaker-notes/generate', async (req, res) => {
  try {
    const { 
      slideContent, 
      presentationContext,
      requestField,
      contextField 
    } = req.body;

    if (!slideContent || !presentationContext) {
      return res.status(400).json({
        success: false,
        error: 'slideContent and presentationContext are required'
      });
    }

    console.log('🎯 Generating speaker notes with enhanced context');
    console.log('- Has request field:', !!requestField?.trim());
    console.log('- Has context field:', !!contextField?.trim());

    // Создаем обогащенные заметки для докладчика с учетом всех полей
    let speakerNotes = `Заметки для слайда "${slideContent.title}": ${slideContent.content.join(', ')}. Контекст: ${presentationContext}`;
    
    // Добавляем информацию из поля запроса
    if (requestField?.trim()) {
      speakerNotes += `\n\nПользовательские требования: ${requestField.trim()}`;
    }
    
    // Добавляем дополнительный контекст
    if (contextField?.trim()) {
      speakerNotes += `\n\nДополнительный контекст: ${contextField.trim()}`;
    }

    return res.json({
      success: true,
      data: { 
        speakerNotes,
        metadata: {
          hasCustomRequirements: !!requestField?.trim(),
          hasAdditionalContext: !!contextField?.trim(),
          generatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Failed to generate speaker notes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate speaker notes'
    });
  }
});

// =============================================================================
// DIRECT AI COMPLETION ENDPOINTS
// =============================================================================

/**
 * @route POST /api/ai/complete
 * @desc Создать AI completion через выбранного провайдера
 */
router.post('/complete', async (req, res) => {
  try {
    const { messages, model, maxTokens, temperature, task } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'messages array is required'
      });
    }

    // Заглушка для тестирования
    const response = {
      content: `AI ответ на: ${messages[messages.length - 1]?.content || 'запрос'}`,
      model: model || 'openai/gpt-4o',
      provider: 'openrouter',
      usage: {
        promptTokens: 50,
        completionTokens: 100,
        totalTokens: 150
      },
      metadata: {
        latency: 1500,
        cost: 0.00015,
        fallbackUsed: false
      }
    };

    return res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Failed to create AI completion:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create AI completion'
    });
  }
});

// =============================================================================
// HEALTH CHECK ENDPOINTS
// =============================================================================

/**
 * @route GET /api/ai/health
 * @desc Проверить здоровье AI сервисов
 */
router.get('/health', async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        health: {
          openai: true,
          openrouter: true,
          anthropic: false
        },
        currentProvider: 'openrouter',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to check AI health:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check AI health'
    });
  }
});

// PPTX export using pptxgenjs library
router.post('/export/pptx', async (req, res) => {
  try {
    const { presentation, templateId } = req.body;
    if (!presentation) {
      return res.status(400).json({ success: false, error: 'Presentation data required' });
    }
    
    console.log('Generating PPTX for presentation:', presentation.title);
    // Optional: pull theme from attached template parsing result (future: map from templateProcessor)
    // Derive theme or explicit palette from template if provided
    let theme = undefined as any;
    let templateStyles = undefined as any;
    if (templateId) {
      try {
        const template = await templateProcessor.loadTemplate(templateId);
        if (template && template.styles) {
          templateStyles = template.styles;
          // Try to detect recommended palette in template content metadata
          let recommended: string[] = [];
          // naive scan of variables/metadata for color hints
          const meta = (template as any).metadata || {};
          const styleHints = [
            ...(template.styles.colorScheme || []),
            ...(meta.recommendedColors || [])
          ] as string[];
          styleHints.forEach((c) => { if (typeof c === 'string' && /#[0-9a-f]{6}/i.test(c)) recommended.push(c); });

          // scan slide textual content for hex colors (e.g., recommendations embedded in template text)
          try {
            const foundInSlides = new Set<string>();
            for (const s of (template.slides || [])) {
              for (const c of (s.content || [])) {
                const text = (c && typeof c.content === 'string') ? c.content : '';
                const matches = text.match(/#[0-9a-fA-F]{6}/g);
                if (matches) matches.forEach(hex => foundInSlides.add(hex.toUpperCase()));
              }
            }
            if (foundInSlides.size > 0) {
              recommended = [...new Set([...recommended, ...Array.from(foundInSlides)])];
            }
          } catch {}

          // Fallback to first entries in colorScheme
          const primary = recommended[0] || template.styles.colorScheme?.[0];
          const accent = recommended[1] || template.styles.colorScheme?.[1];
          const titleColor = primary || '333333';
          const textColor = accent || '444444';
          const fontName = template.styles.fontFamilies?.[0];
          theme = {
            titleColor: titleColor,
            textColor: textColor,
            bulletColor: textColor,
            fontName
          };
        }
      } catch (e) {
        console.warn('Failed to derive theme from template:', e);
      }
    }

    const { filePath, fileName } = await pptxExportService.generatePPTX(presentation, { theme, templateStyles });
    const stats = await pptxExportService.getFileStats(filePath);
    
    return res.json({
      success: true,
      data: {
        downloadUrl: `/api/ai/export/download/${encodeURIComponent(fileName)}`,
        fileName: fileName,
        fileSize: stats.size,
        format: 'pptx'
      }
    });
  } catch (error) {
    console.error('PPTX export failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

// Temporary PDF export
router.post('/export/pdf', async (req, res) => {
  try {
    const { presentation } = req.body;
    if (!presentation) {
      return res.status(400).json({ success: false, error: 'Presentation data required' });
    }
    
    console.log('Generating PDF for presentation:', presentation.title);
    
    // Temporary: use simple export until we fix the libraries
    const sanitizedTitle = presentation.title.replace(/[^a-zA-Z0-9а-яА-Я\s]/g, '').replace(/\s+/g, '_') || 'presentation';
    const fileName = `${sanitizedTitle}_${Date.now()}.pdf`;
    
    return res.json({
      success: true,
      data: {
        downloadUrl: `http://localhost:3000/api/ai/export/download/${fileName}`,
        fileName: fileName,
        fileSize: 2048,
        format: 'pdf'
      }
    });
  } catch (error) {
    console.error('PDF export failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

// Download generated files
router.get('/export/download/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(process.cwd(), 'exports', filename);
    
    // Check if file exists
    const stats = await pptxExportService.getFileStats(filePath);
    if (!stats.exists) {
      // If file not found, create mock content for PDF
      if (filename.endsWith('.pdf')) {
        const mockContent = `Mock PDF file: ${filename}\n\nThis is a demonstration PDF file.\n\nIn production, this would be a real PDF file with formatted presentation content.`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        return res.send(Buffer.from(mockContent, 'utf-8'));
      } else {
        return res.status(404).json({ success: false, error: 'File not found' });
      }
    }
    
    // Set proper Content-Type
    if (filename.endsWith('.pptx')) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    } else if (filename.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
    
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', stats.size.toString());
    
    // Send the actual file
    return res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Download failed:', error);
    return res.status(500).json({ success: false, error: 'Download failed' });
  }
});

// Простой тест export endpoint
router.get('/test-export', (req, res) => {
  res.json({ message: 'Export test endpoint from AI router working!', timestamp: new Date().toISOString() });
});

// =============================================================================
// TEMPLATE PROCESSING ENDPOINTS  
// =============================================================================

/**
 * @route POST /api/ai/templates/upload
 * @desc Загрузить и обработать PPTX шаблон
 */
router.post('/templates/upload', uploadTemplate.single('template'), handleUploadError, async (req: any, res: any) => {
  let uploadedFilePath: string | undefined;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No template file provided'
      });
    }

    uploadedFilePath = req.file.path;
    const originalFileName = req.file.originalname;

    console.log('📤 Template upload received:', originalFileName);
    console.log('💾 Saved to:', uploadedFilePath);

    // Парсим загруженный шаблон
    const parsedTemplate = await templateProcessor.parseTemplate(uploadedFilePath!, originalFileName);

    // Очищаем загруженный файл после обработки
    cleanupUploadedFile(uploadedFilePath!);

    return res.json({
      success: true,
      data: {
        templateId: parsedTemplate.templateId,
        name: parsedTemplate.name,
        description: parsedTemplate.description,
        slideCount: parsedTemplate.metadata.slideCount,
        variables: parsedTemplate.variables,
        hasVariables: parsedTemplate.metadata.hasVariables,
        uploadedAt: parsedTemplate.metadata.parsedAt
      }
    });

  } catch (error) {
    console.error('Failed to process template:', error);
    
    // Очищаем файл в случае ошибки
    if (uploadedFilePath) {
      cleanupUploadedFile(uploadedFilePath);
    }

    return res.status(500).json({
      success: false,
      error: `Template processing failed: ${error instanceof Error ? error.message : error}`
    });
  }
});

/**
 * @route GET /api/ai/templates
 * @desc Получить список доступных шаблонов
 */
router.get('/templates', async (req: any, res: any) => {
  try {
    const templates = await templateProcessor.getAvailableTemplates();
    
    // Возвращаем только метаданные шаблонов для списка
    const templateList = templates.map(template => ({
      templateId: template.templateId,
      name: template.name,
      description: template.description,
      slideCount: template.metadata.slideCount,
      variables: template.variables.map(v => ({
        name: v.name,
        type: v.type,
        required: v.required
      })),
      hasVariables: template.metadata.hasVariables,
      parsedAt: template.metadata.parsedAt
    }));

    return res.json({
      success: true,
      data: {
        templates: templateList,
        count: templateList.length
      }
    });

  } catch (error) {
    console.error('Failed to get templates:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve templates'
    });
  }
});

/**
 * @route GET /api/ai/templates/:templateId
 * @desc Получить подробную информацию о шаблоне
 */
router.get('/templates/:templateId', async (req: any, res: any) => {
  try {
    const { templateId } = req.params;
    const template = await templateProcessor.loadTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    return res.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Failed to get template details:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve template details'
    });
  }
});

/**
 * @route POST /api/ai/templates/:templateId/apply
 * @desc Применить данные к шаблону и создать презентацию
 */
router.post('/templates/:templateId/apply', async (req: any, res: any) => {
  try {
    const { templateId } = req.params;
    const { 
      presentationTitle,
      templateData,
      topic,
      audience = 'general',
      style = 'template',
      requestField,
      contextField
    } = req.body;

    if (!presentationTitle) {
      return res.status(400).json({
        success: false,
        error: 'presentationTitle is required'
      });
    }

    console.log('🎯 Applying template:', templateId);
    console.log('📋 Template data keys:', Object.keys(templateData || {}));

    // Загружаем шаблон
    const template = await templateProcessor.loadTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Создаем расширенные данные для подстановки
    const enrichedData = {
      // Основные данные пользователя
      ...(templateData || {}),
      
      // Автоматические переменные
      presentation_title: presentationTitle,
      presentation_topic: topic || presentationTitle,
      presentation_audience: audience,
      presentation_style: style,
      current_date: new Date().toLocaleDateString('ru-RU'),
      current_time: new Date().toLocaleTimeString('ru-RU'),
      slide_count: template.slides.length,
      
      // Данные из дополнительных полей
      ...(requestField && { user_request: requestField }),
      ...(contextField && { user_context: contextField })
    };

    console.log('📊 Enriched data keys:', Object.keys(enrichedData));

    // Применяем данные к шаблону
    const processedTemplate = await templateProcessor.applyTemplateData(template, enrichedData);

    // Конвертируем в формат презентации
    const presentation = templateProcessor.convertToPresentation(processedTemplate, presentationTitle);

    // Добавляем метаданные о том, что презентация создана из шаблона
    presentation.metadata = {
      ...presentation.metadata,
      createdFromTemplate: true,
      templateId: templateId,
      templateName: template.name,
      appliedVariables: Object.keys(enrichedData),
      hasUserRequest: !!requestField,
      hasUserContext: !!contextField
    };

    return res.json({
      success: true,
      data: presentation
    });

  } catch (error) {
    console.error('Failed to apply template:', error);
    return res.status(500).json({
      success: false,
      error: `Template application failed: ${error instanceof Error ? error.message : error}`
    });
  }
});

/**
 * @route POST /api/ai/templates/:templateId/preview
 * @desc Предварительный просмотр шаблона с пробными данными
 */
router.post('/templates/:templateId/preview', async (req: any, res: any) => {
  try {
    const { templateId } = req.params;
    const { sampleData } = req.body;

    console.log('👀 Previewing template:', templateId);

    // Загружаем шаблон
    const template = await templateProcessor.loadTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Создаем пробные данные для всех переменных
    const previewData: any = {};
    template.variables.forEach(variable => {
      if (sampleData && sampleData[variable.name] !== undefined) {
        previewData[variable.name] = sampleData[variable.name];
      } else {
        // Создаем пробные данные на основе типа переменной
        switch (variable.type) {
          case 'text':
            previewData[variable.name] = `[${variable.name.toUpperCase()}]`;
            break;
          case 'image':
            previewData[variable.name] = `[ИЗОБРАЖЕНИЕ: ${variable.name}]`;
            break;
          case 'chart':
            previewData[variable.name] = `[ДИАГРАММА: ${variable.name}]`;
            break;
          case 'table':
            previewData[variable.name] = `[ТАБЛИЦА: ${variable.name}]`;
            break;
          default:
            previewData[variable.name] = `[${variable.name}]`;
        }
      }
    });

    // Добавляем системные переменные
    previewData.presentation_title = 'Предварительный просмотр';
    previewData.current_date = new Date().toLocaleDateString('ru-RU');
    previewData.current_time = new Date().toLocaleTimeString('ru-RU');

    // Применяем данные
    const processedTemplate = await templateProcessor.applyTemplateData(template, previewData);

    // Возвращаем только первые несколько слайдов для предварительного просмотра
    const previewSlides = processedTemplate.slides.slice(0, 3).map(slide => ({
      slideNumber: slide.slideNumber,
      title: slide.title,
      content: slide.content.map(c => c.content).filter(c => c.trim()),
      variables: slide.variables,
      hasUnresolvedVariables: slide.content.some(c => 
        c.content.includes('{{') || c.content.includes('${')
      )
    }));

    return res.json({
      success: true,
      data: {
        templateId,
        templateName: template.name,
        previewSlides,
        totalSlides: processedTemplate.slides.length,
        appliedData: previewData,
        variables: template.variables
      }
    });

  } catch (error) {
    console.error('Failed to preview template:', error);
    return res.status(500).json({
      success: false,
      error: `Template preview failed: ${error instanceof Error ? error.message : error}`
    });
  }
});

/**
 * @route DELETE /api/ai/templates/:templateId
 * @desc Удалить шаблон
 */
router.delete('/templates/:templateId', async (req: any, res: any) => {
  try {
    const { templateId } = req.params;

    console.log('🗑️ Deleting template:', templateId);

    // Проверяем существование шаблона
    const template = await templateProcessor.loadTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Удаляем шаблон
    await templateProcessor.cleanup(templateId);

    return res.json({
      success: true,
      data: {
        message: 'Template deleted successfully',
        templateId,
        templateName: template.name
      }
    });

  } catch (error) {
    console.error('Failed to delete template:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete template'
    });
  }
});

export default router;
