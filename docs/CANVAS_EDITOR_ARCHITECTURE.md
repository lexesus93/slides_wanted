# Canvas Editor Architecture

## 🎯 Обзор

Canvas Editor - это интерактивный редактор слайдов, построенный на Fabric.js, который позволяет пользователям визуально создавать и редактировать презентации в реальном времени.

## 🏗️ Архитектура компонентов

```
Canvas Editor
├── Core Engine (Fabric.js wrapper)
├── Tool Panel (Text, Image, Shape tools)
├── Property Panel (Styling controls)
├── Layer Manager (Object hierarchy)
├── AI Integration (Smart suggestions)
└── Export Handler (Canvas to PPTX/PDF)
```

## 🎛️ Основные компоненты

### 1. SlideCanvas (Core Component)

```typescript
interface SlideCanvas {
  // Canvas Management
  canvas: fabric.Canvas;
  currentSlide: number;
  slides: SlideData[];
  
  // Object Manipulation
  addText(text: string, options?: TextOptions): void;
  addImage(url: string, options?: ImageOptions): void;
  addShape(type: ShapeType, options?: ShapeOptions): void;
  deleteSelected(): void;
  duplicateSelected(): void;
  
  // Layout & Alignment
  alignObjects(alignment: AlignmentType): void;
  distributeObjects(distribution: DistributionType): void;
  groupObjects(): void;
  ungroupObjects(): void;
  
  // Canvas State
  saveState(): CanvasState;
  loadState(state: CanvasState): void;
  undo(): void;
  redo(): void;
  
  // Export
  exportToJSON(): SlideJSON;
  exportToPNG(): string;
  exportToSVG(): string;
}
```

### 2. Tool Panel

```typescript
interface ToolPanel {
  // Tool Categories
  textTools: {
    addHeading(): void;
    addBodyText(): void;
    addBulletList(): void;
    addNumberedList(): void;
  };
  
  imageTools: {
    uploadImage(): void;
    addFromLibrary(): void;
    addPlaceholder(): void;
  };
  
  shapeTools: {
    addRectangle(): void;
    addCircle(): void;
    addArrow(): void;
    addLine(): void;
  };
  
  layoutTools: {
    applyTemplate(template: LayoutTemplate): void;
    suggestLayout(): void;
    resetLayout(): void;
  };
}
```

### 3. Property Panel

```typescript
interface PropertyPanel {
  // Text Properties
  textProperties: {
    fontFamily: string;
    fontSize: number;
    fontWeight: FontWeight;
    fontStyle: FontStyle;
    textAlign: TextAlign;
    textColor: string;
    backgroundColor: string;
    lineHeight: number;
  };
  
  // Object Properties
  objectProperties: {
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
    opacity: number;
    zIndex: number;
  };
  
  // Shape Properties
  shapeProperties: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    borderRadius?: number;
  };
  
  // Animation Properties (future)
  animationProperties: {
    entranceEffect: AnimationType;
    exitEffect: AnimationType;
    duration: number;
    delay: number;
  };
}
```

## 🤖 AI Integration Points

### 1. Smart Layout Suggestions

```typescript
interface AILayoutEngine {
  // Analyze current content and suggest optimal layout
  suggestLayout(content: SlideContent): Promise<LayoutSuggestion[]>;
  
  // Auto-arrange objects for better visual hierarchy
  optimizeLayout(objects: fabric.Object[]): Promise<OptimizedLayout>;
  
  // Suggest improvements for current slide
  suggestImprovements(slide: SlideData): Promise<Improvement[]>;
  
  // Auto-apply design principles
  applyDesignPrinciples(slide: SlideData): Promise<SlideData>;
}

interface LayoutSuggestion {
  id: string;
  name: string;
  description: string;
  confidence: number;
  preview: string; // base64 image
  layout: LayoutData;
  reasoning: string;
}
```

### 2. Content Generation Integration

```typescript
interface ContentIntegration {
  // Generate slide content from AI and apply to canvas
  applyAIContent(content: AIGeneratedContent): void;
  
  // Update canvas when AI suggests changes
  updateFromAI(updates: ContentUpdate[]): void;
  
  // Send canvas state to AI for analysis
  analyzeCurrentSlide(): Promise<SlideAnalysis>;
}
```

## 🎨 Canvas Configuration

### Standard Slide Dimensions

```typescript
const SLIDE_DIMENSIONS = {
  // Standard 16:9 presentation
  STANDARD: { width: 1920, height: 1080 },
  
  // 4:3 classic format
  CLASSIC: { width: 1024, height: 768 },
  
  // Mobile-friendly
  MOBILE: { width: 1080, height: 1920 },
  
  // Wide screen
  WIDE: { width: 2560, height: 1080 }
};

const CANVAS_CONFIG: fabric.CanvasOptions = {
  width: SLIDE_DIMENSIONS.STANDARD.width,
  height: SLIDE_DIMENSIONS.STANDARD.height,
  backgroundColor: '#ffffff',
  selection: true,
  preserveObjectStacking: true,
  renderOnAddRemove: true,
  stateful: true,
  allowTouchScrolling: false
};
```

### Grid and Snap Settings

```typescript
interface GridSettings {
  enabled: boolean;
  size: number;
  color: string;
  opacity: number;
  snapToGrid: boolean;
  snapThreshold: number;
}

const DEFAULT_GRID: GridSettings = {
  enabled: true,
  size: 20,
  color: '#e0e0e0',
  opacity: 0.5,
  snapToGrid: true,
  snapThreshold: 10
};
```

## 🛠️ Object Types and Templates

### Text Objects

```typescript
interface TextObjectOptions extends fabric.TextOptions {
  type: 'heading' | 'body' | 'caption' | 'bullet' | 'number';
  level?: 1 | 2 | 3 | 4 | 5 | 6; // for headings
  bulletStyle?: 'disc' | 'circle' | 'square' | 'decimal' | 'alpha';
  placeholder?: string;
}

const TEXT_PRESETS = {
  title: {
    fontSize: 48,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    textAlign: 'center',
    fill: '#333333'
  },
  subtitle: {
    fontSize: 32,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    textAlign: 'center',
    fill: '#666666'
  },
  body: {
    fontSize: 24,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    textAlign: 'left',
    fill: '#333333'
  }
};
```

### Image Objects

```typescript
interface ImageObjectOptions extends fabric.ImageOptions {
  type: 'photo' | 'illustration' | 'chart' | 'diagram' | 'logo';
  filter?: ImageFilter;
  mask?: fabric.Object;
  placeholder?: boolean;
}

interface ImageFilter {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  sepia?: boolean;
  grayscale?: boolean;
}
```

### Shape Objects

```typescript
interface ShapeObjectOptions extends fabric.ObjectOptions {
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'custom';
  style: ShapeStyle;
}

interface ShapeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDashArray?: number[];
  shadow?: fabric.Shadow;
  gradient?: fabric.Gradient;
}
```

## 🎯 Layout Templates

### Predefined Layouts

```typescript
interface LayoutTemplate {
  id: string;
  name: string;
  category: 'title' | 'content' | 'comparison' | 'process' | 'conclusion';
  thumbnail: string;
  objects: LayoutObject[];
  guidelines: LayoutGuideline[];
}

interface LayoutObject {
  type: 'text' | 'image' | 'shape' | 'placeholder';
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: ObjectStyle;
  content?: string;
  placeholder?: string;
}

const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'title-slide',
    name: 'Титульный слайд',
    category: 'title',
    thumbnail: '/templates/title-slide.png',
    objects: [
      {
        type: 'text',
        position: { x: 960, y: 400 },
        size: { width: 800, height: 100 },
        style: TEXT_PRESETS.title,
        placeholder: 'Заголовок презентации'
      },
      {
        type: 'text', 
        position: { x: 960, y: 520 },
        size: { width: 600, height: 60 },
        style: TEXT_PRESETS.subtitle,
        placeholder: 'Подзаголовок'
      }
    ],
    guidelines: [
      { type: 'center-vertical', position: 540 },
      { type: 'center-horizontal', position: 960 }
    ]
  }
  // ... другие шаблоны
];
```

## 🔄 State Management

### Canvas State

```typescript
interface CanvasState {
  slides: SlideState[];
  currentSlideIndex: number;
  history: HistoryState[];
  historyIndex: number;
  clipboard: fabric.Object[];
}

interface SlideState {
  id: string;
  objects: fabric.Object[];
  background: string | fabric.Pattern;
  metadata: SlideMetadata;
}

interface HistoryState {
  action: 'add' | 'remove' | 'modify' | 'move' | 'resize';
  timestamp: number;
  before: any;
  after: any;
  objectId?: string;
}
```

### Event Handling

```typescript
interface CanvasEvents {
  // Object events
  'object:added': (e: fabric.IEvent) => void;
  'object:removed': (e: fabric.IEvent) => void;
  'object:modified': (e: fabric.IEvent) => void;
  'object:selected': (e: fabric.IEvent) => void;
  'selection:cleared': (e: fabric.IEvent) => void;
  
  // Canvas events
  'canvas:cleared': () => void;
  'canvas:exported': (format: string, data: any) => void;
  
  // Custom events
  'slide:changed': (slideIndex: number) => void;
  'layout:applied': (layoutId: string) => void;
  'ai:suggestion': (suggestion: any) => void;
}
```

## 🚀 Performance Optimization

### Rendering Optimization

```typescript
interface PerformanceConfig {
  // Virtualization for large presentations
  enableVirtualization: boolean;
  maxVisibleSlides: number;
  
  // Canvas optimization
  enableRetina: boolean;
  pixelRatio: number;
  renderOnAddRemove: boolean;
  
  // Object caching
  enableObjectCaching: boolean;
  statefullCache: boolean;
  
  // Lazy loading
  lazyLoadImages: boolean;
  preloadAdjacentSlides: number;
}
```

## 🔌 Export Integration

### Canvas to PPTX

```typescript
interface CanvasExporter {
  // Convert canvas objects to PPTX elements
  exportToPPTX(): Promise<Buffer>;
  
  // Map fabric objects to PPTX equivalents
  mapFabricToPPTX(object: fabric.Object): PPTXElement;
  
  // Preserve styling and positioning
  preserveFormatting(object: fabric.Object): PPTXFormat;
  
  // Handle complex objects
  exportGroups(group: fabric.Group): PPTXGroup;
  exportImages(image: fabric.Image): PPTXImage;
  exportText(text: fabric.Text): PPTXText;
}
```

Этот Canvas Editor будет ядром нашего MVP - мощным, но достаточно простым для первой версии!
