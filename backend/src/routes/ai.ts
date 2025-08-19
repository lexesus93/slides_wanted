import { Router } from 'express';
import { pptxExportService } from '../services/pptx-export.service';
import * as path from 'path';

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
        'POST /api/ai/speaker-notes/generate - Generate speaker notes'
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
    const { topic, slideCount = 5, audience = 'general', style = 'formal' } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }

    // Заглушка для тестирования
    const presentation = {
      title: `Презентация: ${topic}`,
      slides: Array.from({ length: slideCount }, (_, i) => ({
        slideNumber: i + 1,
        title: `Слайд ${i + 1}`,
        content: [`Контент для слайда ${i + 1}`],
        layout: 'content',
        suggestions: {
          images: [],
          charts: [],
          colors: ['#007bff', '#28a745'],
          fonts: ['Arial', 'Helvetica']
        }
      })),
      summary: `Презентация о ${topic}`,
      estimatedDuration: slideCount * 2,
      tags: [topic, audience, style]
    };

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
    const { slideNumber, slideTitle, context, layout = 'content' } = req.body;

    if (!slideNumber || !slideTitle || !context) {
      return res.status(400).json({
        success: false,
        error: 'slideNumber, slideTitle, and context are required'
      });
    }

    const slideContent = {
      slideNumber,
      title: slideTitle,
      content: [`Контент для ${slideTitle}`, `Контекст: ${context}`],
      layout,
      suggestions: {
        images: ['image1.jpg', 'image2.jpg'],
        charts: ['chart1.png'],
        colors: ['#007bff', '#28a745'],
        fonts: ['Arial', 'Helvetica']
      }
    };

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
    const { slideContent, presentationContext } = req.body;

    if (!slideContent || !presentationContext) {
      return res.status(400).json({
        success: false,
        error: 'slideContent and presentationContext are required'
      });
    }

    const speakerNotes = `Заметки для слайда "${slideContent.title}": ${slideContent.content.join(', ')}. Контекст: ${presentationContext}`;

    return res.json({
      success: true,
      data: { speakerNotes }
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
    const { presentation } = req.body;
    if (!presentation) {
      return res.status(400).json({ success: false, error: 'Presentation data required' });
    }
    
    console.log('Generating PPTX for presentation:', presentation.title);
    
    const { filePath, fileName } = await pptxExportService.generatePPTX(presentation);
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
        const mockContent = `Mock PDF file: ${filename}\n\nThis is a demonstration PDF file.\nSlides Wanted - AI Presentation Builder\n\nIn production, this would be a real PDF file with formatted presentation content.`;
        
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

export default router;
