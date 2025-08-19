import { Application } from 'express';

// =============================================================================
// ROUTES SETUP
// =============================================================================

export function setupRoutes(app: Application): void {
  console.log('🛣️ Setting up API routes...');

  // AI Routes (includes export functionality)
  try {
    const aiRoutes = require('./ai').default;
    app.use('/api/ai', aiRoutes);
    console.log('✅ AI routes loaded');
  } catch (error) {
    console.warn('⚠️ AI routes not loaded:', error);
  }

  // Health check для AI сервисов
  app.get('/api/ai/status', (req, res) => {
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
        'POST /api/ai/export/pptx - Export to PPTX',
        'POST /api/ai/export/pdf - Export to PDF',
        'GET /api/ai/export/download/:filename - Download exported file'
      ]
    });
  });

  console.log('✅ Routes setup completed');
}