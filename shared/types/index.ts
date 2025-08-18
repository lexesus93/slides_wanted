// =============================================================================
// SHARED TYPES - AI Presentation Builder
// =============================================================================

// =============================================================================
// USER & AUTHENTICATION
// =============================================================================
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  subscription_tier: 'free' | 'premium' | 'enterprise';
  created_at: Date;
  updated_at: Date;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

// =============================================================================
// PRESENTATION & SLIDES
// =============================================================================
export interface Presentation {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  template_id?: string;
  slides: Slide[];
  metadata: PresentationMetadata;
  status: 'draft' | 'ready' | 'exported';
  created_at: Date;
  updated_at: Date;
}

export interface Slide {
  id: string;
  presentation_id: string;
  slide_number: number;
  title: string;
  content: SlideContent;
  layout: SlideLayout;
  canvas_data?: CanvasData;
  metadata: SlideMetadata;
  created_at: Date;
  updated_at: Date;
}

export interface SlideContent {
  title?: string;
  subtitle?: string;
  body?: string;
  bullet_points?: string[];
  images?: ImageContent[];
  charts?: ChartContent[];
  notes?: string;
}

export interface ImageContent {
  id: string;
  url: string;
  alt_text: string;
  caption?: string;
  position: Position;
  size: Size;
}

export interface ChartContent {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter';
  data: any;
  title?: string;
  position: Position;
  size: Size;
}

// =============================================================================
// CANVAS & LAYOUT
// =============================================================================
export interface CanvasData {
  objects: CanvasObject[];
  background: string | BackgroundPattern;
  dimensions: CanvasDimensions;
  version: string;
}

export interface CanvasObject {
  id: string;
  type: 'text' | 'image' | 'shape' | 'group';
  position: Position;
  size: Size;
  rotation?: number;
  opacity?: number;
  z_index: number;
  properties: ObjectProperties;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CanvasDimensions {
  width: number;
  height: number;
  ratio: '16:9' | '4:3' | 'custom';
}

export interface ObjectProperties {
  // Text properties
  text?: string;
  font_family?: string;
  font_size?: number;
  font_weight?: 'normal' | 'bold' | 'bolder' | 'lighter';
  font_style?: 'normal' | 'italic' | 'oblique';
  text_align?: 'left' | 'center' | 'right' | 'justify';
  text_color?: string;
  text_decoration?: 'none' | 'underline' | 'line-through';
  
  // Shape properties
  fill?: string;
  stroke?: string;
  stroke_width?: number;
  border_radius?: number;
  
  // Image properties
  src?: string;
  alt?: string;
  filter?: ImageFilter;
  
  // Animation properties
  animation?: AnimationProperties;
}

export interface AnimationProperties {
  entrance_effect?: AnimationType;
  exit_effect?: AnimationType;
  duration?: number;
  delay?: number;
  easing?: string;
}

export type AnimationType = 
  | 'fade' | 'slide' | 'bounce' | 'zoom' | 'rotate' | 'flip' | 'none';

export interface ImageFilter {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  sepia?: boolean;
  grayscale?: boolean;
}

export interface BackgroundPattern {
  type: 'color' | 'gradient' | 'image' | 'pattern';
  value: string;
  opacity?: number;
}

// =============================================================================
// TEMPLATES & LAYOUTS
// =============================================================================
export interface Template {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  thumbnail: string;
  file_path: string;
  layouts: Layout[];
  styles: TemplateStyles;
  metadata: TemplateMetadata;
  popularity_score: number;
  created_at: Date;
  updated_at: Date;
}

export type TemplateCategory = 
  | 'business' | 'education' | 'creative' | 'marketing' | 'startup' | 'corporate';

export interface Layout {
  id: string;
  name: string;
  type: LayoutType;
  thumbnail: string;
  objects: LayoutObject[];
  guidelines: LayoutGuideline[];
  metadata: LayoutMetadata;
}

export type LayoutType = 
  | 'title' | 'content' | 'two-column' | 'comparison' | 'process' | 'conclusion' | 'custom';

export interface LayoutObject {
  type: 'text' | 'image' | 'shape' | 'placeholder';
  position: Position;
  size: Size;
  style: ObjectStyle;
  content?: string;
  placeholder?: string;
  constraints?: LayoutConstraints;
}

export interface LayoutGuideline {
  type: 'horizontal' | 'vertical' | 'center-horizontal' | 'center-vertical';
  position: number;
  color?: string;
  visible?: boolean;
}

export interface LayoutConstraints {
  min_width?: number;
  max_width?: number;
  min_height?: number;
  max_height?: number;
  aspect_ratio?: number;
  snap_to_grid?: boolean;
}

export interface ObjectStyle {
  font_family?: string;
  font_size?: number;
  font_weight?: string;
  color?: string;
  background_color?: string;
  border_color?: string;
  border_width?: number;
  border_radius?: number;
  padding?: number;
  margin?: number;
}

export interface TemplateStyles {
  color_scheme: ColorScheme;
  typography: Typography;
  spacing: Spacing;
  effects: Effects;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
  success: string;
  warning: string;
  error: string;
}

export interface Typography {
  heading_font: string;
  body_font: string;
  code_font: string;
  font_sizes: FontSizes;
  line_heights: LineHeights;
}

export interface FontSizes {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
}

export interface LineHeights {
  tight: number;
  normal: number;
  relaxed: number;
  loose: number;
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export interface Effects {
  shadow: string;
  border_radius: number;
  transition: string;
}

// =============================================================================
// AI & CONTENT GENERATION
// =============================================================================
export interface AIGenerationRequest {
  prompt: string;
  slide_count?: number;
  template_id?: string;
  style_preferences?: StylePreferences;
  content_type?: ContentType;
}

export interface AIGenerationResponse {
  slides: AIGeneratedSlide[];
  suggested_layouts: Layout[];
  confidence_score: number;
  generation_time: number;
  tokens_used: number;
}

export interface AIGeneratedSlide {
  title: string;
  content: SlideContent;
  suggested_layout_id: string;
  speaker_notes?: string;
  confidence_score: number;
}

export interface StylePreferences {
  color_scheme?: 'light' | 'dark' | 'colorful' | 'minimal';
  layout_style?: 'modern' | 'classic' | 'creative' | 'corporate';
  content_density?: 'minimal' | 'balanced' | 'detailed';
}

export type ContentType = 
  | 'business_pitch' | 'educational' | 'marketing' | 'report' | 'portfolio' | 'other';

export interface LayoutOptimizationRequest {
  slide_content: SlideContent;
  available_layouts: Layout[];
  canvas_dimensions: CanvasDimensions;
  style_preferences?: StylePreferences;
}

export interface LayoutOptimizationResponse {
  recommended_layout: Layout;
  optimized_objects: CanvasObject[];
  confidence_score: number;
  reasoning: string;
  alternatives: LayoutAlternative[];
}

export interface LayoutAlternative {
  layout: Layout;
  score: number;
  reason: string;
}

// =============================================================================
// EXPORT & FILE HANDLING
// =============================================================================
export interface ExportRequest {
  presentation_id: string;
  format: ExportFormat;
  options: ExportOptions;
}

export type ExportFormat = 'pptx' | 'pdf' | 'html' | 'png' | 'jpg';

export interface ExportOptions {
  include_animations?: boolean;
  include_notes?: boolean;
  quality?: 'low' | 'medium' | 'high';
  page_size?: 'A4' | 'letter' | 'custom';
  orientation?: 'landscape' | 'portrait';
  compression?: boolean;
}

export interface ExportJob {
  id: string;
  user_id: string;
  presentation_id: string;
  format: ExportFormat;
  status: ExportStatus;
  progress: number;
  file_url?: string;
  file_size?: number;
  error_message?: string;
  created_at: Date;
  completed_at?: Date;
}

export type ExportStatus = 
  | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface FileUpload {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  url: string;
  uploaded_at: Date;
}

// =============================================================================
// WEBSOCKET EVENTS
// =============================================================================
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  user_id?: string;
  session_id?: string;
}

// Client to Server Events
export interface SlideGenerateEvent {
  type: 'slide:generate';
  data: {
    prompt: string;
    template_id?: string;
    style_preferences?: StylePreferences;
  };
}

export interface SlideUpdateEvent {
  type: 'slide:update';
  data: {
    slide_id: string;
    canvas_data: CanvasData;
  };
}

export interface TemplateUploadEvent {
  type: 'template:upload';
  data: {
    file_data: ArrayBuffer;
    filename: string;
  };
}

export interface ExportRequestEvent {
  type: 'export:request';
  data: ExportRequest;
}

// Server to Client Events
export interface SlideGeneratedEvent {
  type: 'slide:generated';
  data: {
    slides: AIGeneratedSlide[];
    suggested_layouts: Layout[];
    generation_time: number;
  };
}

export interface TemplateProcessedEvent {
  type: 'template:processed';
  data: {
    template: Template;
    processing_time: number;
  };
}

export interface ExportProgressEvent {
  type: 'export:progress';
  data: {
    export_id: string;
    progress: number;
    stage: string;
  };
}

export interface ExportCompletedEvent {
  type: 'export:completed';
  data: {
    export_id: string;
    download_url: string;
    file_size: number;
  };
}

export interface ErrorEvent {
  type: 'error';
  data: {
    code: string;
    message: string;
    details?: any;
  };
}

// =============================================================================
// METADATA INTERFACES
// =============================================================================
export interface PresentationMetadata {
  total_slides: number;
  estimated_duration: number; // в минутах
  last_edited: Date;
  collaborators?: string[];
  tags?: string[];
  language: string;
}

export interface SlideMetadata {
  estimated_read_time: number; // в секундах
  word_count: number;
  layout_confidence?: number;
  ai_generated: boolean;
}

export interface TemplateMetadata {
  author: string;
  version: string;
  compatible_ratios: string[];
  download_count: number;
  rating: number;
  tags: string[];
}

export interface LayoutMetadata {
  effectiveness_score?: number;
  usage_count: number;
  suitable_for: ContentType[];
  complexity_level: 'simple' | 'medium' | 'complex';
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: ResponseMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}

export interface ResponseMeta {
  timestamp: number;
  request_id: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================
export type SlideLayout = Layout;

export type CreatePresentationRequest = Omit<Presentation, 'id' | 'created_at' | 'updated_at' | 'slides'> & {
  initial_prompt?: string;
};

export type UpdatePresentationRequest = Partial<Pick<Presentation, 'title' | 'description' | 'status'>>;

export type CreateSlideRequest = Omit<Slide, 'id' | 'created_at' | 'updated_at' | 'slide_number'>;

export type UpdateSlideRequest = Partial<Pick<Slide, 'title' | 'content' | 'layout' | 'canvas_data'>>;

// =============================================================================
// ENUM-LIKE CONSTANTS
// =============================================================================
export const SUBSCRIPTION_TIERS = ['free', 'premium', 'enterprise'] as const;
export const PRESENTATION_STATUSES = ['draft', 'ready', 'exported'] as const;
export const EXPORT_FORMATS = ['pptx', 'pdf', 'html', 'png', 'jpg'] as const;
export const EXPORT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const;
export const TEMPLATE_CATEGORIES = ['business', 'education', 'creative', 'marketing', 'startup', 'corporate'] as const;
export const LAYOUT_TYPES = ['title', 'content', 'two-column', 'comparison', 'process', 'conclusion', 'custom'] as const;
export const CONTENT_TYPES = ['business_pitch', 'educational', 'marketing', 'report', 'portfolio', 'other'] as const;
