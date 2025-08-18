import dotenv from 'dotenv';
import path from 'path';

// Загружаем переменные окружения
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// =============================================================================
// ВАЛИДАЦИЯ ОБЯЗАТЕЛЬНЫХ ПЕРЕМЕННЫХ
// =============================================================================
const requiredEnvVars = [
  'POSTGRES_URL',
  'REDIS_URL',
  'OPENAI_API_KEY',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// =============================================================================
// КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
// =============================================================================
export const config = {
  // Основные настройки
  app: {
    name: 'AI Presentation Builder',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiVersion: process.env.API_VERSION || 'v1',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test'
  },

  // База данных
  database: {
    url: process.env.POSTGRES_URL!,
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'slides_wanted',
    username: process.env.POSTGRES_USER || 'slides_user',
    password: process.env.POSTGRES_PASSWORD || 'slides_password',
    ssl: process.env.POSTGRES_SSL === 'true',
    maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20', 10),
    idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000', 10)
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL!,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'slides:',
    maxRetriesPerRequest: 3
  },

  // MinIO/S3 Storage
  storage: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucketName: process.env.MINIO_BUCKET_NAME || 'slides-wanted',
    region: process.env.MINIO_REGION || 'us-east-1'
  },

  // AI Services
  ai: {
    // OpenAI (прямое взаимодействие)
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000', 10),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      organization: process.env.OPENAI_ORGANIZATION || undefined
    },
    
    // OpenRouter.ai (унифицированный API)
    openrouter: {
      enabled: process.env.OPENROUTER_ENABLED !== 'false', // По умолчанию включен
      apiKey: process.env.OPENROUTER_API_KEY || undefined,
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4o',
      fallbackModels: process.env.OPENROUTER_FALLBACK_MODELS?.split(',') || [
        'anthropic/claude-3.5-sonnet',
        'meta-llama/llama-3.1-8b-instruct',
        'google/gemini-pro'
      ],
      appAttribution: {
        siteUrl: process.env.OPENROUTER_SITE_URL || 'http://localhost:3001',
        siteName: process.env.OPENROUTER_SITE_NAME || 'AI Presentation Builder'
      },
      // Настройки для автоматического выбора модели
      autoModelSelection: process.env.OPENROUTER_AUTO_SELECTION !== 'false', // По умолчанию включено
      costOptimization: process.env.OPENROUTER_COST_OPTIMIZATION !== 'false', // По умолчанию включено
      latencyOptimization: process.env.OPENROUTER_LATENCY_OPTIMIZATION !== 'false' // По умолчанию включено
    },
    
    // Anthropic (альтернатива OpenAI)
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || undefined,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
    },
    
    // Настройки провайдера по умолчанию
    defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'openrouter', // 'openai' | 'openrouter' | 'anthropic'
    
    // Настройки fallback
    fallbackEnabled: process.env.AI_FALLBACK_ENABLED === 'true',
    fallbackOrder: process.env.AI_FALLBACK_ORDER?.split(',') || ['openrouter', 'openai', 'anthropic']
  },

  // Безопасность
  security: {
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      algorithm: 'HS256' as const
    },
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
      credentials: process.env.CORS_CREDENTIALS === 'true',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 минут
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    bcrypt: {
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
    }
  },

  // Логирование
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'json',
    file: process.env.LOG_FILE || undefined,
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE === 'true',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '14', 10)
  },

  // WebSocket
  websocket: {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    upgradeTimeout: 30000,
    pingTimeout: 60000,
    pingInterval: 25000
  },

  // Экспорт
  export: {
    puppeteer: {
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      args: process.env.PUPPETEER_ARGS?.split(',') || [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      timeout: parseInt(process.env.PUPPETEER_TIMEOUT || '30000', 10)
    },
    pptx: {
      compressionLevel: parseInt(process.env.PPTX_COMPRESSION_LEVEL || '6', 10),
      imageQuality: parseInt(process.env.PPTX_IMAGE_QUALITY || '80', 10),
      maxSlides: parseInt(process.env.PPTX_MAX_SLIDES || '100', 10)
    },
    pdf: {
      format: 'A4' as const,
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    }
  },

  // Загрузка файлов
  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '50', 10) * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint', // .ppt
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml'
    ],
    tempDir: process.env.UPLOAD_TEMP_DIR || '/tmp/uploads',
    cleanupInterval: parseInt(process.env.UPLOAD_CLEANUP_INTERVAL || '3600000', 10) // 1 час
  },

  // Cache настройки
  cache: {
    defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10), // 5 минут
    templates: {
      ttl: parseInt(process.env.CACHE_TEMPLATES_TTL || '3600', 10) // 1 час
    },
    layouts: {
      ttl: parseInt(process.env.CACHE_LAYOUTS_TTL || '1800', 10) // 30 минут
    },
    ai: {
      ttl: parseInt(process.env.CACHE_AI_TTL || '600', 10) // 10 минут
    }
  },

  // Мониторинг
  monitoring: {
    healthCheck: {
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10)
    },
    metrics: {
      enabled: process.env.METRICS_ENABLED === 'true',
      port: parseInt(process.env.METRICS_PORT || '9090', 10),
      endpoint: process.env.METRICS_ENDPOINT || '/metrics'
    }
  },

  // Лимиты для подписок
  limits: {
    free: {
      presentationsPerMonth: 10,
      slidesPerPresentation: 20,
      templatesUpload: 5,
      exportsPerDay: 10,
      aiRequestsPerHour: 50
    },
    premium: {
      presentationsPerMonth: 100,
      slidesPerPresentation: 100,
      templatesUpload: 50,
      exportsPerDay: 100,
      aiRequestsPerHour: 500
    },
    enterprise: {
      presentationsPerMonth: -1, // unlimited
      slidesPerPresentation: -1,
      templatesUpload: -1,
      exportsPerDay: -1,
      aiRequestsPerHour: -1
    }
  }
} as const;

// =============================================================================
// ВАЛИДАЦИЯ КОНФИГУРАЦИИ
// =============================================================================
function validateConfig() {
  // Проверяем порт
  if (config.app.port < 1 || config.app.port > 65535) {
    throw new Error(`Invalid port: ${config.app.port}`);
  }

  // Проверяем JWT secret
  if (config.security.jwt.secret.length < 32) {
    console.warn('JWT secret is too short. Use at least 32 characters for production.');
  }

  // Проверяем настройки базы данных
  if (!config.database.url.startsWith('postgresql://')) {
    throw new Error('Invalid PostgreSQL URL format');
  }

  // Проверяем настройки Redis
  if (!config.redis.url.startsWith('redis://') && !config.redis.url.startsWith('rediss://')) {
    throw new Error('Invalid Redis URL format');
  }

  console.log('✅ Configuration validated successfully');
}

// Запускаем валидацию при загрузке модуля
validateConfig();

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
export function getConfig() {
  return config;
}

export function isDevelopment() {
  return config.app.isDevelopment;
}

export function isProduction() {
  return config.app.isProduction;
}

export function isTest() {
  return config.app.isTest;
}

export default config;
