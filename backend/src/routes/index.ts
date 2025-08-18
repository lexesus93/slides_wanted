import { Application } from 'express';

// =============================================================================
// ROUTES SETUP
// =============================================================================

export function setupRoutes(app: Application): void {
  console.log('🛣️ Setting up API routes...');

  // AI Routes
  try {
    const aiRoutes = require('./ai').default;
    app.use('/api/ai', aiRoutes);
    console.log('✅ AI routes loaded');
  } catch (error) {
    console.warn('⚠️ AI routes not loaded:', error);
  }

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

  console.log('✅ All routes configured');
}
