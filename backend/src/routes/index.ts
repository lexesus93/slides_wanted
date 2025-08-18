import { Application } from 'express';
import { logger } from '@/utils/logger';

// =============================================================================
// ROUTES SETUP
// =============================================================================

export function setupRoutes(app: Application): void {
  logger.info('🛣️ Setting up API routes...');

  // AI Routes
  try {
    const aiRoutes = require('./ai').default;
    app.use('/api/ai', aiRoutes);
    logger.info('✅ AI routes loaded');
  } catch (error) {
    logger.warn('⚠️ AI routes not loaded:', error);
  }

  // Auth Routes (placeholder)
  app.get('/api/auth/status', (req, res) => {
    res.json({ message: 'Auth service not implemented yet' });
  });

  // User Routes (placeholder)
  app.get('/api/users/profile', (req, res) => {
    res.json({ message: 'User service not implemented yet' });
  });

  // Presentation Routes (placeholder)
  app.get('/api/presentations', (req, res) => {
    res.json({ message: 'Presentation service not implemented yet' });
  });

  // File Routes (placeholder)
  app.get('/api/files/upload', (req, res) => {
    res.json({ message: 'File service not implemented yet' });
  });

  // Health check для AI сервисов
  app.get('/api/ai/status', (req, res) => {
    res.json({ 
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
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
      availableRoutes: [
        '/health',
        '/api/ai/status',
        '/api/ai/providers',
        '/api/ai/models',
        '/api/ai/usage',
        '/api/ai/health',
        '/api/ai/complete',
        '/api/ai/presentations/generate',
        '/api/ai/slides/generate',
        '/api/ai/layouts/analyze',
        '/api/ai/speaker-notes/generate'
      ]
    });
  });

  logger.info('✅ All routes configured');
}
