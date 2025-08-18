import winston from 'winston';
import config from '@/config';

// =============================================================================
// LOGGER CONFIGURATION
// =============================================================================

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Создаем logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: 'ai-presentation-builder',
    version: config.app.version
  },
  transports: []
});

// Console transport
if (config.logging.enableConsole) {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: config.logging.level
  }));
}

// File transport (если включен)
if (config.logging.enableFile && config.logging.file) {
  logger.add(new winston.transports.File({
    filename: config.logging.file,
    maxsize: config.logging.maxSize,
    maxFiles: config.logging.maxFiles,
    format: logFormat
  }));
}

// Обработка ошибок
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

// Экспорт logger
export { logger };

// =============================================================================
// REQUEST LOGGER MIDDLEWARE
// =============================================================================

export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  // Логируем входящий запрос
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Перехватываем ответ
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0
    });
  });

  next();
};

// =============================================================================
// ERROR LOGGER
// =============================================================================

export const errorLogger = (error: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  next(error);
};
