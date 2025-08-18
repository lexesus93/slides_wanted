import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import config from '@/config';
import { logger } from '@/utils/logger';
import { DatabaseService } from '@/services/database';
import { RedisService } from '@/services/redis';
import { StorageService } from '@/services/storage';
import { setupRoutes } from '@/routes';
import { setupWebSocket } from '@/websocket';
import { errorHandler, notFoundHandler } from '@/middleware/error';
import { requestLogger } from '@/middleware/logging';
import { setupSwagger } from '@/utils/swagger';

/**
 * Основной класс приложения
 */
class App {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: config.websocket.cors,
      transports: config.websocket.transports,
      upgradeTimeout: config.websocket.upgradeTimeout,
      pingTimeout: config.websocket.pingTimeout,
      pingInterval: config.websocket.pingInterval
    });
  }

  /**
   * Инициализация приложения
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🚀 Starting AI Presentation Builder Backend...');

      // Инициализация сервисов
      await this.initializeServices();

      // Настройка middleware
      this.setupMiddleware();

      // Настройка маршрутов
      this.setupRoutes();

      // Настройка WebSocket
      this.setupWebSocket();

      // Настройка обработки ошибок
      this.setupErrorHandling();

      // Настройка документации API
      if (config.app.isDevelopment) {
        this.setupDocumentation();
      }

      logger.info('✅ Application initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Инициализация внешних сервисов
   */
  private async initializeServices(): Promise<void> {
    logger.info('🔧 Initializing services...');

    try {
      // Инициализация базы данных
      logger.info('📊 Connecting to PostgreSQL...');
      await DatabaseService.getInstance().initialize();
      logger.info('✅ PostgreSQL connected');

      // Инициализация Redis
      logger.info('🔴 Connecting to Redis...');
      await RedisService.getInstance().initialize();
      logger.info('✅ Redis connected');

      // Инициализация хранилища файлов
      logger.info('💾 Connecting to MinIO...');
      await StorageService.getInstance().initialize();
      logger.info('✅ MinIO connected');

    } catch (error) {
      logger.error('❌ Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Настройка middleware
   */
  private setupMiddleware(): void {
    logger.info('⚙️ Setting up middleware...');

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Отключаем для разработки
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    this.app.use(cors(config.security.cors));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.security.rateLimit.windowMs,
      max: config.security.rateLimit.maxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Пропускаем health check endpoints
        return req.path === '/health' || req.path === '/metrics';
      }
    });

    this.app.use(limiter);

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: config.app.version,
        environment: config.app.env,
        services: {
          database: DatabaseService.getInstance().isConnected(),
          redis: RedisService.getInstance().isConnected(),
          storage: StorageService.getInstance().isConnected()
        }
      });
    });

    logger.info('✅ Middleware configured');
  }

  /**
   * Настройка маршрутов API
   */
  private setupRoutes(): void {
    logger.info('🛣️ Setting up routes...');
    setupRoutes(this.app);
    logger.info('✅ Routes configured');
  }

  /**
   * Настройка WebSocket соединений
   */
  private setupWebSocket(): void {
    logger.info('🔌 Setting up WebSocket...');
    setupWebSocket(this.io);
    logger.info('✅ WebSocket configured');
  }

  /**
   * Настройка обработки ошибок
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler (должен быть последним)
    this.app.use(errorHandler);

    // Обработка uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Обработка unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Обработка SIGTERM и SIGINT
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      this.gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received');
      this.gracefulShutdown('SIGINT');
    });

    logger.info('✅ Error handling configured');
  }

  /**
   * Настройка документации API (Swagger)
   */
  private setupDocumentation(): void {
    logger.info('📚 Setting up API documentation...');
    setupSwagger(this.app);
    logger.info('✅ API documentation available at /docs');
  }

  /**
   * Запуск сервера
   */
  async start(): Promise<void> {
    try {
      await this.initialize();

      this.server.listen(config.app.port, () => {
        logger.info(`🎉 Server running on port ${config.app.port}`);
        logger.info(`🌍 Environment: ${config.app.env}`);
        logger.info(`📖 API Documentation: http://localhost:${config.app.port}/docs`);
        logger.info(`💡 Health Check: http://localhost:${config.app.port}/health`);
        
        if (config.app.isDevelopment) {
          logger.info(`🔧 Development mode - Hot reload enabled`);
        }
      });

    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);

    // Даем время для завершения текущих запросов
    const shutdownTimeout = setTimeout(() => {
      logger.error('⏰ Graceful shutdown timeout. Forcing exit...');
      process.exit(1);
    }, 30000); // 30 секунд timeout

    try {
      // Закрываем HTTP сервер
      await new Promise<void>((resolve, reject) => {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            logger.info('✅ HTTP server closed');
            resolve();
          }
        });
      });

      // Закрываем WebSocket соединения
      this.io.close(() => {
        logger.info('✅ WebSocket server closed');
      });

      // Закрываем соединения с сервисами
      await DatabaseService.getInstance().disconnect();
      await RedisService.getInstance().disconnect();
      await StorageService.getInstance().disconnect();

      clearTimeout(shutdownTimeout);
      logger.info('✅ Graceful shutdown completed');
      process.exit(0);

    } catch (error) {
      logger.error('❌ Error during graceful shutdown:', error);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  }

  /**
   * Получить экземпляр Express приложения
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Получить экземпляр HTTP сервера
   */
  getServer(): http.Server {
    return this.server;
  }

  /**
   * Получить экземпляр Socket.IO сервера
   */
  getIO(): SocketIOServer {
    return this.io;
  }
}

// Создаем и запускаем приложение только если это главный модуль
if (require.main === module) {
  const app = new App();
  app.start().catch((error) => {
    logger.error('❌ Application startup failed:', error);
    process.exit(1);
  });
}

export default App;
