# Структура проекта AI-Powered Presentation Builder

## 📁 Общая структура

```
slides_wanted/
├── 📁 backend/                   # Backend (Node.js + TypeScript)
├── 📁 frontend/                  # Frontend (React + TypeScript)
├── 📁 shared/                    # Общие типы и утилиты
├── 📁 docs/                      # Документация
├── 📁 docker/                    # Docker конфигурация
├── 📁 scripts/                   # Скрипты развертывания
├── 📄 Makefile                   # Автоматизация команд
├── 📄 README.md                  # Основная документация
├── 📄 .env.example               # Пример конфигурации
├── 📄 .gitignore                 # Git ignore правила
└── 📄 PROJECT_STRUCTURE.md       # Этот файл
```

## 🎯 Backend структура

```
backend/
├── 📁 src/
│   ├── 📁 config/                # Конфигурация приложения
│   │   └── 📄 index.ts           # Центральная конфигурация
│   │
│   ├── 📁 services/              # Бизнес-логика и внешние сервисы
│   │   ├── 📄 database.ts        # PostgreSQL подключение
│   │   ├── 📄 redis.ts           # Redis кеширование
│   │   ├── 📄 storage.ts         # MinIO файловое хранилище
│   │   ├── 📄 auth.ts            # JWT аутентификация
│   │   │
│   │   ├── 📁 ai/                # ИИ сервисы
│   │   │   ├── 📄 openai.ts      # OpenAI интеграция
│   │   │   ├── 📄 content-generator.ts  # Генерация контента
│   │   │   ├── 📄 layout-analyzer.ts    # Анализ лайаутов
│   │   │   └── 📄 prompt-builder.ts     # Построение промптов
│   │   │
│   │   ├── 📁 template/          # Обработка шаблонов
│   │   │   ├── 📄 processor.ts   # PPTX парсинг
│   │   │   ├── 📄 extractor.ts   # Извлечение лайаутов
│   │   │   └── 📄 converter.ts   # Конвертация в JSON
│   │   │
│   │   ├── 📁 presentation/      # Управление презентациями
│   │   │   ├── 📄 builder.ts     # Построение презентаций
│   │   │   ├── 📄 optimizer.ts   # Оптимизация лайаутов
│   │   │   └── 📄 validator.ts   # Валидация контента
│   │   │
│   │   └── 📁 export/            # Экспорт презентаций
│   │       ├── 📄 pptx-exporter.ts    # PPTX генерация
│   │       ├── 📄 pdf-exporter.ts     # PDF генерация
│   │       ├── 📄 html-exporter.ts    # HTML экспорт
│   │       └── 📄 export-manager.ts   # Управление экспортом
│   │
│   ├── 📁 controllers/           # HTTP контроллеры
│   │   ├── 📄 auth.ts            # Аутентификация
│   │   ├── 📄 ai.ts              # ИИ endpoints
│   │   ├── 📄 templates.ts       # Управление шаблонами
│   │   ├── 📄 presentations.ts   # CRUD презентаций
│   │   └── 📄 export.ts          # Экспорт endpoints
│   │
│   ├── 📁 routes/                # Маршрутизация API
│   │   ├── 📄 index.ts           # Основной роутер
│   │   ├── 📄 auth.ts            # Auth маршруты
│   │   ├── 📄 api.ts             # API маршруты
│   │   └── 📄 websocket.ts       # WebSocket маршруты
│   │
│   ├── 📁 middleware/            # Express middleware
│   │   ├── 📄 auth.ts            # Аутентификация
│   │   ├── 📄 validation.ts      # Валидация запросов
│   │   ├── 📄 error.ts           # Обработка ошибок
│   │   ├── 📄 logging.ts         # Логирование запросов
│   │   └── 📄 cors.ts            # CORS настройки
│   │
│   ├── 📁 models/                # Модели данных
│   │   ├── 📄 user.ts            # Модель пользователя
│   │   ├── 📄 presentation.ts    # Модель презентации
│   │   ├── 📄 slide.ts           # Модель слайда
│   │   ├── 📄 template.ts        # Модель шаблона
│   │   └── 📄 export-job.ts      # Модель задачи экспорта
│   │
│   ├── 📁 utils/                 # Утилиты
│   │   ├── 📄 logger.ts          # Winston logger
│   │   ├── 📄 swagger.ts         # Swagger документация
│   │   ├── 📄 crypto.ts          # Криптографические функции
│   │   ├── 📄 file.ts            # Работа с файлами
│   │   └── 📄 validation.ts      # Валидация схем
│   │
│   ├── 📁 database/              # База данных
│   │   ├── 📄 connection.ts      # Подключение к БД
│   │   ├── 📄 migrations/        # Миграции схемы
│   │   ├── 📄 seeds/             # Тестовые данные
│   │   └── 📄 queries/           # SQL запросы
│   │
│   ├── 📁 websocket/             # WebSocket обработчики
│   │   ├── 📄 index.ts           # Основной WebSocket сервер
│   │   ├── 📄 events.ts          # Обработчики событий
│   │   ├── 📄 rooms.ts           # Управление комнатами
│   │   └── 📄 auth.ts            # WebSocket аутентификация
│   │
│   └── 📄 index.ts               # Точка входа приложения
│
├── 📄 package.json               # NPM зависимости
├── 📄 tsconfig.json              # TypeScript конфигурация
├── 📄 Dockerfile.dev             # Docker для разработки
├── 📄 Dockerfile.prod            # Docker для продакшена
├── 📄 .eslintrc.js               # ESLint конфигурация
├── 📄 .prettierrc                # Prettier конфигурация
└── 📄 jest.config.js             # Jest тестирование
```

## 🎨 Frontend структура

```
frontend/
├── 📁 src/
│   ├── 📁 components/            # React компоненты
│   │   ├── 📁 Canvas/            # Canvas Editor
│   │   │   ├── 📄 SlideCanvas.tsx      # Основной canvas
│   │   │   ├── 📄 CanvasToolbar.tsx    # Панель инструментов
│   │   │   ├── 📄 ObjectControls.tsx   # Управление объектами
│   │   │   ├── 📄 GridOverlay.tsx      # Сетка и направляющие
│   │   │   └── 📄 index.ts             # Экспорт компонентов
│   │   │
│   │   ├── 📁 ToolPanel/         # Панель инструментов
│   │   │   ├── 📄 TextTools.tsx        # Текстовые инструменты
│   │   │   ├── 📄 ImageTools.tsx       # Инструменты изображений
│   │   │   ├── 📄 ShapeTools.tsx       # Инструменты фигур
│   │   │   └── 📄 LayoutTools.tsx      # Выбор лайаутов
│   │   │
│   │   ├── 📁 PropertyPanel/     # Панель свойств
│   │   │   ├── 📄 TextProperties.tsx   # Свойства текста
│   │   │   ├── 📄 ObjectProperties.tsx # Свойства объектов
│   │   │   └── 📄 StyleProperties.tsx  # Стили и эффекты
│   │   │
│   │   ├── 📁 Chat/              # Чат интерфейс
│   │   │   ├── 📄 ChatInterface.tsx    # Основной чат
│   │   │   ├── 📄 MessageList.tsx      # Список сообщений
│   │   │   ├── 📄 MessageInput.tsx     # Поле ввода
│   │   │   ├── 📄 MessageBubble.tsx    # Сообщение
│   │   │   ├── 📄 TypingIndicator.tsx  # Индикатор печати
│   │   │   └── 📄 SuggestionChips.tsx  # Быстрые действия
│   │   │
│   │   ├── 📁 Upload/            # Загрузка файлов
│   │   │   ├── 📄 FileUpload.tsx       # Drag & drop
│   │   │   ├── 📄 UploadProgress.tsx   # Прогресс загрузки
│   │   │   └── 📄 FilePreview.tsx      # Превью шаблона
│   │   │
│   │   ├── 📁 Export/            # Экспорт презентаций
│   │   │   ├── 📄 ExportDialog.tsx     # Диалог экспорта
│   │   │   ├── 📄 ExportProgress.tsx   # Прогресс экспорта
│   │   │   ├── 📄 DownloadManager.tsx  # Управление загрузками
│   │   │   └── 📄 FormatSelector.tsx   # Выбор формата
│   │   │
│   │   ├── 📁 Preview/           # Превью презентаций
│   │   │   ├── 📄 SlidePreview.tsx     # Превью слайда
│   │   │   └── 📄 PresentationPreview.tsx # Превью презентации
│   │   │
│   │   ├── 📁 Layout/            # Основной layout
│   │   │   ├── 📄 MainLayout.tsx       # Главный layout
│   │   │   ├── 📄 Sidebar.tsx          # Боковая панель
│   │   │   └── 📄 Header.tsx           # Верхняя панель
│   │   │
│   │   ├── 📁 LayerManager/      # Управление слоями
│   │   │   ├── 📄 LayerList.tsx        # Список слоев
│   │   │   └── 📄 LayerItem.tsx        # Элемент слоя
│   │   │
│   │   └── 📁 Common/            # Общие компоненты
│   │       ├── 📄 Button.tsx           # Кастомная кнопка
│   │       ├── 📄 Modal.tsx            # Модальное окно
│   │       ├── 📄 Loading.tsx          # Индикатор загрузки
│   │       └── 📄 ErrorBoundary.tsx    # Обработка ошибок
│   │
│   ├── 📁 hooks/                 # React hooks
│   │   ├── 📄 useCanvas.ts             # Canvas state
│   │   ├── 📄 useFabricObjects.ts      # Fabric объекты
│   │   ├── 📄 useCanvasHistory.ts      # Undo/redo
│   │   ├── 📄 useKeyboardShortcuts.ts  # Горячие клавиши
│   │   ├── 📄 useWebSocket.ts          # WebSocket подключение
│   │   ├── 📄 useAuth.ts               # Аутентификация
│   │   └── 📄 useUpload.ts             # Загрузка файлов
│   │
│   ├── 📁 stores/                # State management (Zustand)
│   │   ├── 📄 chatStore.ts             # Состояние чата
│   │   ├── 📄 canvasStore.ts           # Состояние canvas
│   │   ├── 📄 presentationStore.ts     # Данные презентации
│   │   ├── 📄 authStore.ts             # Аутентификация
│   │   └── 📄 uiStore.ts               # UI состояние
│   │
│   ├── 📁 services/              # API и внешние сервисы
│   │   ├── 📄 api.ts                   # HTTP API клиент
│   │   ├── 📄 websocket.ts             # Socket.IO клиент
│   │   ├── 📄 auth.ts                  # Сервис аутентификации
│   │   ├── 📄 upload.ts                # Сервис загрузки
│   │   ├── 📄 chat.ts                  # Логика чата
│   │   └── 📄 export.ts                # Сервис экспорта
│   │
│   ├── 📁 utils/                 # Утилиты
│   │   ├── 📁 fabric/            # Fabric.js утилиты
│   │   │   ├── 📄 objectFactory.ts     # Создание объектов
│   │   │   ├── 📄 canvasManager.ts     # Управление canvas
│   │   │   ├── 📄 exportUtils.ts       # Экспорт утилиты
│   │   │   └── 📄 layoutUtils.ts       # Лайаут утилиты
│   │   │
│   │   ├── 📁 canvas/            # Canvas утилиты
│   │   │   ├── 📄 gridUtils.ts         # Сетка
│   │   │   ├── 📄 snapUtils.ts         # Привязка
│   │   │   └── 📄 alignmentUtils.ts    # Выравнивание
│   │   │
│   │   ├── 📁 export/            # Экспорт утилиты
│   │   │   ├── 📄 canvasToData.ts      # Сериализация canvas
│   │   │   ├── 📄 formatConverters.ts  # Конвертация форматов
│   │   │   └── 📄 downloadUtils.ts     # Загрузка файлов
│   │   │
│   │   ├── 📄 constants.ts             # Константы
│   │   ├── 📄 helpers.ts               # Вспомогательные функции
│   │   ├── 📄 validation.ts            # Валидация
│   │   └── 📄 format.ts                # Форматирование
│   │
│   ├── 📁 pages/                 # Страницы приложения
│   │   ├── 📄 Home.tsx                 # Главная страница
│   │   ├── 📄 Editor.tsx               # Редактор презентаций
│   │   ├── 📄 Login.tsx                # Страница входа
│   │   ├── 📄 Register.tsx             # Страница регистрации
│   │   └── 📄 Dashboard.tsx            # Дашборд пользователя
│   │
│   ├── 📁 types/                 # TypeScript типы
│   │   ├── 📄 canvas.ts                # Canvas типы
│   │   ├── 📄 fabric.ts                # Fabric.js типы
│   │   └── 📄 api.ts                   # API типы
│   │
│   ├── 📁 styles/                # Стили
│   │   ├── 📄 globals.css              # Глобальные стили
│   │   ├── 📄 components.css           # Стили компонентов
│   │   └── 📄 canvas.css               # Canvas стили
│   │
│   ├── 📁 assets/                # Статические ресурсы
│   │   ├── 📁 images/                  # Изображения
│   │   ├── 📁 icons/                   # Иконки
│   │   └── 📁 fonts/                   # Шрифты
│   │
│   ├── 📁 test/                  # Тестирование
│   │   ├── 📄 setup.ts                 # Настройка тестов
│   │   ├── 📁 components/              # Тесты компонентов
│   │   ├── 📁 hooks/                   # Тесты hooks
│   │   └── 📁 utils/                   # Тесты утилит
│   │
│   ├── 📄 App.tsx                      # Главный компонент
│   ├── 📄 main.tsx                     # Точка входа
│   └── 📄 vite-env.d.ts                # Vite типы
│
├── 📄 package.json               # NPM зависимости
├── 📄 tsconfig.json              # TypeScript конфигурация
├── 📄 vite.config.ts             # Vite конфигурация
├── 📄 tailwind.config.js         # Tailwind CSS конфигурация
├── 📄 postcss.config.js          # PostCSS конфигурация
├── 📄 Dockerfile.dev             # Docker для разработки
├── 📄 .eslintrc.js               # ESLint конфигурация
├── 📄 .prettierrc                # Prettier конфигурация
├── 📄 vitest.config.ts           # Vitest конфигурация
└── 📄 index.html                 # HTML шаблон
```

## 🔗 Shared структура

```
shared/
├── 📁 types/                     # Общие TypeScript типы
│   └── 📄 index.ts               # Все типы данных
│
├── 📁 utils/                     # Общие утилиты
│   ├── 📄 constants.ts           # Константы
│   ├── 📄 validation.ts          # Схемы валидации
│   └── 📄 helpers.ts             # Вспомогательные функции
│
├── 📁 schemas/                   # JSON схемы
│   ├── 📄 presentation.json      # Схема презентации
│   ├── 📄 slide.json             # Схема слайда
│   └── 📄 template.json          # Схема шаблона
│
└── 📄 package.json               # NPM пакет для shared
```

## 📚 Docs структура

```
docs/
├── 📄 ARCHITECTURE.md            # Общая архитектура
├── 📄 CANVAS_EDITOR_ARCHITECTURE.md # Архитектура Canvas Editor
├── 📄 PHASE_1_PLAN.md            # План первой фазы
├── 📄 API.md                     # API документация
├── 📄 DEVELOPMENT.md             # Гайд разработчика
├── 📄 DEPLOYMENT.md              # Инструкции по деплою
├── 📄 TESTING.md                 # Стратегия тестирования
├── 📄 CONTRIBUTING.md            # Гайд для контрибьюторов
└── 📁 images/                    # Диаграммы и схемы
    ├── 📄 architecture.png
    ├── 📄 canvas-flow.png
    └── 📄 data-flow.png
```

## 🐳 Docker структура

```
docker/
├── 📄 docker-compose.yml         # Продакшен compose
├── 📄 docker-compose.dev.yml     # Разработка compose
├── 📄 docker-compose.test.yml    # Тестирование compose
├── 📁 init-scripts/              # Инициализация БД
│   ├── 📄 01-init-db.sql         # Создание схемы
│   └── 📄 02-seed-data.sql       # Тестовые данные
├── 📁 nginx/                     # Nginx конфигурация
│   ├── 📄 nginx.conf             # Основная конфигурация
│   └── 📄 default.conf           # Виртуальный хост
└── 📁 monitoring/                # Мониторинг стек
    ├── 📄 prometheus.yml         # Prometheus конфигурация
    └── 📄 grafana-dashboards/    # Grafana дашборды
```

## 🔧 Scripts структура

```
scripts/
├── 📄 setup.sh                  # Первоначальная настройка
├── 📄 deploy.sh                 # Скрипт деплоя
├── 📄 backup.sh                 # Бэкап данных
├── 📄 migrate.sh                # Миграции БД
├── 📄 test.sh                   # Запуск тестов
└── 📄 cleanup.sh                # Очистка системы
```

## 🎯 Ключевые файлы

### Backend ключевые файлы:
- `backend/src/index.ts` - Точка входа приложения
- `backend/src/config/index.ts` - Центральная конфигурация
- `backend/src/services/ai/openai.ts` - ИИ интеграция
- `backend/src/services/template/processor.ts` - PPTX обработка
- `backend/src/services/export/pptx-exporter.ts` - PPTX экспорт

### Frontend ключевые файлы:
- `frontend/src/main.tsx` - Точка входа React приложения
- `frontend/src/components/Canvas/SlideCanvas.tsx` - Главный Canvas Editor
- `frontend/src/components/Chat/ChatInterface.tsx` - Интерфейс чата
- `frontend/src/stores/canvasStore.ts` - State management Canvas
- `frontend/src/utils/fabric/canvasManager.ts` - Fabric.js утилиты

### Shared ключевые файлы:
- `shared/types/index.ts` - Все TypeScript типы
- `shared/utils/constants.ts` - Константы приложения

## 🚀 Команды разработки

```bash
# Настройка проекта
make setup

# Запуск инфраструктуры
make infra-up

# Запуск разработки
make dev

# Остановка сервисов
make infra-down

# Просмотр логов
make logs

# Тестирование
make test

# Сборка
make build

# Очистка
make clean
```

Эта структура обеспечивает:
- 🎯 **Модульность** - четкое разделение ответственности
- 🔄 **Масштабируемость** - легко добавлять новые компоненты
- 🛠️ **Разработка** - удобная среда для команды
- 🚀 **Деплой** - готовая Docker инфраструктура
- 📚 **Документация** - полное покрытие документацией
