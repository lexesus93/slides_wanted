import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Создаем директорию для загрузок
const uploadsDir = path.join(__dirname, '../../temp/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка хранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Создаем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `template-${uniqueSuffix}${extension}`);
  }
});

// Фильтр для проверки типа файла
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Проверяем MIME тип
  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    cb(null, true);
  } else {
    // Проверяем расширение файла как fallback
    const extension = path.extname(file.originalname).toLowerCase();
    if (extension === '.pptx') {
      cb(null, true);
    } else {
      cb(new Error('Only PPTX files are allowed') as any, false);
    }
  }
};

// Конфигурация multer
export const uploadTemplate = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB максимум
    files: 1 // только один файл за раз
  }
});

// Middleware для обработки ошибок загрузки
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'File size too large. Maximum size is 50MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files. Only one file is allowed.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field.'
        });
      default:
        return res.status(400).json({
          success: false,
          error: `Upload error: ${error.message}`
        });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      error: error.message || 'File upload failed'
    });
  }
  
  next();
};

// Utility функция для очистки загруженных файлов
export const cleanupUploadedFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ Cleaned up uploaded file:', filePath);
    }
  } catch (error) {
    console.error('Failed to cleanup uploaded file:', error);
  }
};
