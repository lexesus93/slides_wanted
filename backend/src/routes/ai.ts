import { Router } from 'express';
import { aiProviderService } from '@/services/ai/ai-provider';
import { aiContentGeneratorService } from '@/services/ai/content-generator';
import { openRouterService } from '@/services/ai/openrouter';
import { openAIService } from '@/services/ai/openai';
import { logger } from '@/utils/logger';

const router = Router();

// =============================================================================
// AI PROVIDER ENDPOINTS
// =============================================================================

/**
 * @route GET /api/ai/providers
 * @desc Получить доступные AI провайдеры
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = await aiProviderService.getAvailableProviders();
    const health = await aiProviderService.healthCheck();
    
    res.json({
      success: true,
      data: {
        providers,
        health,
        currentProvider: aiProviderService.getCurrentProvider()
      }
    });
  } catch (error) {
    logger.error('Failed to get AI providers:', error);
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

    aiProviderService.setProvider(provider);
    
    res.json({
      success: true,
      data: {
        currentProvider: aiProviderService.getCurrentProvider(),
        message: `Switched to ${provider} provider`
      }
    });
  } catch (error) {
    logger.error('Failed to switch AI provider:', error);
    res.status(500).json({
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
    const openRouterModels = await openRouterService.getModels();
    const openAIModels = await openAIService.getAvailableModels();
    
    res.json({
      success: true,
      data: {
        openrouter: openRouterModels.map(model => ({
          id: model.id,
          name: model.name,
          provider: 'openrouter',
          contextLength: model.context_length,
          pricing: model.pricing
        })),
        openai: openAIModels.map(model => ({
          id: model,
          name: model,
          provider: 'openai'
        }))
      }
    });
  } catch (error) {
    logger.error('Failed to get AI models:', error);
    res.status(500).json({
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
    const openRouterUsage = await openRouterService.getUsageStats();
    const openAIUsage = await openAIService.getUsageInfo();
    
    res.json({
      success: true,
      data: {
        openrouter: openRouterUsage,
        openai: openAIUsage
      }
    });
  } catch (error) {
    logger.error('Failed to get AI usage stats:', error);
    res.status(500).json({
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
      includeImages = true,
      includeCharts = true
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }

    const presentation = await aiContentGeneratorService.generatePresentationStructure({
      topic,
      slideCount: Math.min(Math.max(slideCount, 1), 20), // Ограничиваем 1-20 слайдами
      audience,
      style,
      language,
      includeImages,
      includeCharts
    });

    res.json({
      success: true,
      data: presentation
    });
  } catch (error) {
    logger.error('Failed to generate presentation structure:', error);
    res.status(500).json({
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
      context,
      layout = 'content'
    } = req.body;

    if (!slideNumber || !slideTitle || !context) {
      return res.status(400).json({
        success: false,
        error: 'slideNumber, slideTitle, and context are required'
      });
    }

    const slideContent = await aiContentGeneratorService.generateSlideContent(
      slideNumber,
      slideTitle,
      context,
      layout
    );

    res.json({
      success: true,
      data: slideContent
    });
  } catch (error) {
    logger.error('Failed to generate slide content:', error);
    res.status(500).json({
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

    const analysis = await aiContentGeneratorService.analyzeAndOptimizeLayout(
      slideData,
      targetAudience
    );

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Failed to analyze layout:', error);
    res.status(500).json({
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

    const speakerNotes = await aiContentGeneratorService.generateSpeakerNotes(
      slideContent,
      presentationContext
    );

    res.json({
      success: true,
      data: { speakerNotes }
    });
  } catch (error) {
    logger.error('Failed to generate speaker notes:', error);
    res.status(500).json({
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

    const response = await aiProviderService.createCompletion({
      messages,
      model,
      maxTokens,
      temperature,
      task
    });

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Failed to create AI completion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create AI completion'
    });
  }
});

/**
 * @route POST /api/ai/complete/stream
 * @desc Создать streaming AI completion
 */
router.post('/complete/stream', async (req, res) => {
  try {
    const { messages, model, maxTokens, temperature, task } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'messages array is required'
      });
    }

    // Устанавливаем headers для streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await aiProviderService.createCompletion({
      messages,
      model,
      maxTokens,
      temperature,
      task,
      stream: true
    });

    // Обработка streaming response
    const reader = response.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        res.write(chunk);
      }
    } finally {
      reader.releaseLock();
      res.end();
    }
  } catch (error) {
    logger.error('Failed to create streaming AI completion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create streaming AI completion'
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
    const health = await aiProviderService.healthCheck();
    const currentProvider = aiProviderService.getCurrentProvider();
    
    res.json({
      success: true,
      data: {
        health,
        currentProvider,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to check AI health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check AI health'
    });
  }
});

export default router;
