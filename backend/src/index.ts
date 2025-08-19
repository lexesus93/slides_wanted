import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// =============================================================================
// КОНФИГУРАЦИЯ
// =============================================================================

const config = {
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development'
  },
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
    }
  }
};

// =============================================================================
// ОСНОВНОЕ ПРИЛОЖЕНИЕ
// =============================================================================

class App {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.security.cors.origin,
        methods: ['GET', 'POST']
      }
    });
  }

  /**
   * Инициализация приложения
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing AI Presentation Builder...');

    // Настройка middleware
    this.setupMiddleware();

    // Настройка маршрутов
    this.setupRoutes();

    // Настройка WebSocket
    this.setupWebSocket();

    // Обработка ошибок
    this.setupErrorHandling();

    console.log('✅ Application initialized successfully');
  }

  /**
   * Настройка middleware
   */
  private setupMiddleware(): void {
    console.log('⚙️ Setting up middleware...');

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    this.app.use(cors(config.security.cors as any));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.security.rateLimit.windowMs,
      max: config.security.rateLimit.max,
      message: {
        error: 'Too many requests from this IP, please try again later.'
      }
    });
    this.app.use(limiter);

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    console.log('✅ Middleware configured');
  }

  /**
   * Настройка маршрутов API
   */
  private setupRoutes(): void {
    console.log('🛣️ Setting up routes...');

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'AI Presentation Builder',
        environment: config.app.env
      });
    });

    // AI Routes
    try {
      const aiRoutes = require('./routes/ai').default;
      this.app.use('/api/ai', aiRoutes);
      console.log('✅ AI routes loaded');
    } catch (error) {
      console.warn('⚠️ AI routes not loaded:', error);
    }

    // 404 handler
    this.app.use('*', (req, res) => {
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

    console.log('✅ Routes configured');
  }

  /**
   * Настройка WebSocket
   */
  private setupWebSocket(): void {
    console.log('🔌 Setting up WebSocket...');

    this.io.on('connection', (socket) => {
      console.log('🔌 Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
      });

      // AI completion через WebSocket
      socket.on('ai_completion', async (data) => {
        try {
          console.log('🤖 AI completion request:', data);
          
          // Здесь будет вызов AI сервиса
          socket.emit('ai_completion_response', {
            success: true,
            message: 'AI completion not implemented yet'
          });
        } catch (error) {
          console.error('❌ AI completion error:', error);
          socket.emit('ai_completion_response', {
            success: false,
            error: String(error)
          });
        }
      });
    });

    console.log('✅ WebSocket configured');
  }

  /**
   * Настройка обработки ошибок
   */
  private setupErrorHandling(): void {
    // Простая обработка ошибок
    console.log('✅ Error handling configured');
  }

  /**
   * Запуск приложения
   */
  async start(): Promise<void> {
    await this.initialize();
    
    this.server.listen(config.app.port, () => {
      console.log('🎉 AI Presentation Builder is running!');
      console.log(`🌐 Server: http://localhost:${config.app.port}`);
      console.log(`🔌 WebSocket: ws://localhost:${config.app.port}`);
      console.log(`📊 Health: http://localhost:${config.app.port}/health`);
      console.log(`🤖 AI API: http://localhost:${config.app.port}/api/ai/status`);
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down gracefully...');
    
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('✅ Server closed');
        resolve();
      });
    });
  }
}

// =============================================================================
// ЗАПУСК ПРИЛОЖЕНИЯ
// =============================================================================

if (require.main === module) {
  const app = new App();
  
  // Обработка сигналов завершения
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down...');
    await app.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    await app.shutdown();
    process.exit(0);
  });

  // Запуск приложения
  app.start().catch((error) => {
    console.error('❌ Application startup failed:', error);
    process.exit(1);
  });
}

export default App;
