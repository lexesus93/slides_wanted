import * as fs from 'fs';
import * as path from 'path';
import * as yauzl from 'yauzl';
import * as xml2js from 'xml2js';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'image' | 'chart' | 'table';
  placeholder: string;
  defaultValue?: string;
  required?: boolean;
}

export interface ParsedTemplate {
  templateId: string;
  name: string;
  description?: string;
  slides: TemplateSlide[];
  variables: TemplateVariable[];
  styles: TemplateStyles;
  metadata: {
    originalFileName: string;
    parsedAt: string;
    slideCount: number;
    hasVariables: boolean;
  };
}

export interface TemplateSlide {
  slideNumber: number;
  slideId: string;
  title?: string;
  content: TemplateContent[];
  layout: string;
  variables: string[];
  relationships: any[];
}

export interface TemplateContent {
  type: 'text' | 'image' | 'shape' | 'table' | 'chart';
  content: string;
  variables: string[];
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  styles: any;
}

export interface TemplateStyles {
  colorScheme: string[];
  fontFamilies: string[];
  masterLayouts: string[];
  theme: any;
}

export interface TemplateDataBinding {
  [variableName: string]: string | number | boolean | any[];
}

export class TemplateProcessorService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(__dirname, '../../temp/templates');
    this.ensureTempDir();
  }

  /**
   * Создает временную директорию для обработки шаблонов
   */
  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Парсит PPTX файл шаблона
   */
  async parseTemplate(filePath: string, originalFileName: string): Promise<ParsedTemplate> {
    console.log('🔍 Parsing PPTX template:', originalFileName);

    try {
      // Проверяем существование файла
      if (!fs.existsSync(filePath)) {
        throw new Error(`Template file not found: ${filePath}`);
      }

      // Создаем уникальный ID для шаблона
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const extractDir = path.join(this.tempDir, templateId);

      // Извлекаем содержимое PPTX архива
      const extractedFiles = await this.extractPPTX(filePath, extractDir);
      console.log('📁 Extracted files:', extractedFiles.length);

      // Парсим основные компоненты
      const presentation = await this.parsePresentationXML(extractDir);
      const slides = await this.parseSlides(extractDir, presentation.slideIds);
      const styles = await this.parseStyles(extractDir);
      const variables = this.extractVariables(slides);

      const parsedTemplate: ParsedTemplate = {
        templateId,
        name: path.basename(originalFileName, '.pptx'),
        description: `Parsed template from ${originalFileName}`,
        slides,
        variables,
        styles,
        metadata: {
          originalFileName,
          parsedAt: new Date().toISOString(),
          slideCount: slides.length,
          hasVariables: variables.length > 0
        }
      };

      console.log('✅ Template parsing completed');
      console.log(`- Slides: ${slides.length}`);
      console.log(`- Variables: ${variables.length}`);
      console.log(`- Variables found: ${variables.map(v => v.name).join(', ')}`);

      // Сохраняем распарсенный шаблон для дальнейшего использования
      await this.saveTemplate(parsedTemplate);

      return parsedTemplate;

    } catch (error) {
      console.error('❌ Failed to parse template:', error);
      throw new Error(`Template parsing failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Извлекает PPTX архив
   */
  private async extractPPTX(filePath: string, extractDir: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const extractedFiles: string[] = [];

      fs.mkdirSync(extractDir, { recursive: true });

      yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err);
        if (!zipfile) return reject(new Error('Failed to open ZIP file'));

        zipfile.readEntry();

        zipfile.on('entry', (entry) => {
          if (/\/$/.test(entry.fileName)) {
            // Директория
            const dirPath = path.join(extractDir, entry.fileName);
            fs.mkdirSync(dirPath, { recursive: true });
            zipfile.readEntry();
          } else {
            // Файл
            const filePath = path.join(extractDir, entry.fileName);
            const fileDir = path.dirname(filePath);
            
            fs.mkdirSync(fileDir, { recursive: true });

            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) return reject(err);
              if (!readStream) return reject(new Error('Failed to open read stream'));

              const writeStream = fs.createWriteStream(filePath);
              readStream.pipe(writeStream);

              writeStream.on('close', () => {
                extractedFiles.push(entry.fileName);
                zipfile.readEntry();
              });

              writeStream.on('error', reject);
            });
          }
        });

        zipfile.on('end', () => {
          resolve(extractedFiles);
        });

        zipfile.on('error', reject);
      });
    });
  }

  /**
   * Парсит presentation.xml для получения структуры презентации
   */
  private async parsePresentationXML(extractDir: string): Promise<{ slideIds: string[] }> {
    const presentationPath = path.join(extractDir, 'ppt', 'presentation.xml');
    
    if (!fs.existsSync(presentationPath)) {
      throw new Error('presentation.xml not found in template');
    }

    const xmlContent = fs.readFileSync(presentationPath, 'utf8');
    const parser = new xml2js.Parser();
    const result = await new Promise((resolve, reject) => {
      parser.parseString(xmlContent, (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const slideIds: string[] = [];
    
    // Извлекаем ID слайдов
    const sldIdLst = (result as any)?.['p:presentation']?.['p:sldIdLst']?.[0]?.['p:sldId'];
    if (sldIdLst) {
      sldIdLst.forEach((slide: any) => {
        if (slide.$ && slide.$['r:id']) {
          slideIds.push(slide.$['r:id']);
        }
      });
    }

    return { slideIds };
  }

  /**
   * Парсит слайды презентации
   */
  private async parseSlides(extractDir: string, slideIds: string[]): Promise<TemplateSlide[]> {
    const slides: TemplateSlide[] = [];
    const slidesDir = path.join(extractDir, 'ppt', 'slides');

    if (!fs.existsSync(slidesDir)) {
      console.warn('Slides directory not found');
      return slides;
    }

    const slideFiles = fs.readdirSync(slidesDir).filter(f => f.endsWith('.xml'));
    
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      if (!slideFile) continue;
      
      const slidePath = path.join(slidesDir, slideFile);
      
      try {
        const slide = await this.parseSlide(slidePath, i + 1);
        slides.push(slide);
      } catch (error) {
        console.error(`Failed to parse slide ${slideFile}:`, error);
        // Продолжаем с fallback слайдом
        slides.push({
          slideNumber: i + 1,
          slideId: slideFile.replace('.xml', ''),
          title: `Slide ${i + 1}`,
          content: [],
          layout: 'content',
          variables: [],
          relationships: []
        });
      }
    }

    return slides;
  }

  /**
   * Парсит отдельный слайд
   */
  private async parseSlide(slidePath: string, slideNumber: number): Promise<TemplateSlide> {
    const xmlContent = fs.readFileSync(slidePath, 'utf8');
    const parser = new xml2js.Parser();
    const result = await new Promise((resolve, reject) => {
      parser.parseString(xmlContent, (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const slideId = path.basename(slidePath, '.xml');
    const content: TemplateContent[] = [];
    const variables: string[] = [];

    // Парсим содержимое слайда
    const shapes = (result as any)?.['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0]?.['p:sp'];
    
    if (shapes) {
      shapes.forEach((shape: any, index: number) => {
        try {
          const shapeContent = this.parseShape(shape, index);
          if (shapeContent) {
            content.push(shapeContent);
            variables.push(...shapeContent.variables);
          }
        } catch (error) {
          console.warn(`Failed to parse shape in slide ${slideNumber}:`, error);
        }
      });
    }

    // Извлекаем заголовок слайда
    const title = this.extractSlideTitle(content);

    return {
      slideNumber,
      slideId,
      title,
      content,
      layout: 'content', // TODO: определить реальный layout
      variables: [...new Set(variables)], // удаляем дубликаты
      relationships: []
    };
  }

  /**
   * Парсит shape (текст, изображение и т.д.)
   */
  private parseShape(shape: any, index: number): TemplateContent | null {
    try {
      const textBody = shape?.['p:txBody']?.[0];
      if (!textBody) return null;

      const paragraphs = textBody['a:p'];
      if (!paragraphs) return null;

      let textContent = '';
      const variables: string[] = [];

      paragraphs.forEach((paragraph: any) => {
        const runs = paragraph['a:r'];
        if (runs) {
          runs.forEach((run: any) => {
            const text = run['a:t']?.[0];
            if (text) {
              textContent += text;
              // Ищем переменные в формате {{variable}} или ${variable}
              const varMatches = text.match(/\{\{([^}]+)\}\}|\$\{([^}]+)\}/g);
              if (varMatches) {
                varMatches.forEach((match: string) => {
                  const varName = match.replace(/\{\{|\}\}|\$\{|\}/g, '').trim();
                  variables.push(varName);
                });
              }
            }
          });
        }
      });

      if (!textContent.trim()) return null;

      return {
        type: 'text',
        content: textContent,
        variables,
        position: { x: 0, y: 0, width: 100, height: 20 }, // TODO: извлечь реальную позицию
        styles: {}
      };

    } catch (error) {
      console.warn('Failed to parse shape:', error);
      return null;
    }
  }

  /**
   * Извлекает заголовок слайда
   */
  private extractSlideTitle(content: TemplateContent[]): string | undefined {
    // Ищем первый текстовый элемент как потенциальный заголовок
    const firstTextContent = content.find(c => c.type === 'text' && c.content.trim());
    if (firstTextContent) {
      const title = firstTextContent.content.trim();
      return title.length > 50 ? title.substring(0, 50) + '...' : title;
    }
    return undefined;
  }

  /**
   * Парсит стили презентации
   */
  private async parseStyles(extractDir: string): Promise<TemplateStyles> {
    const styles: TemplateStyles = {
      colorScheme: ['#000000', '#FFFFFF'],
      fontFamilies: ['Arial', 'Calibri'],
      masterLayouts: [],
      theme: {}
    };

    try {
      // Парсим тему
      const themePath = path.join(extractDir, 'ppt', 'theme', 'theme1.xml');
      if (fs.existsSync(themePath)) {
        const themeContent = fs.readFileSync(themePath, 'utf8');
        const parser = new xml2js.Parser();
        const themeResult = await new Promise((resolve, reject) => {
          parser.parseString(themeContent, (err: any, result: any) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        styles.theme = themeResult;

        // Извлекаем цветовую схему из theme1.xml
        const clrScheme = (themeResult as any)?.['a:theme']?.['a:themeElements']?.[0]?.['a:clrScheme']?.[0];
        const extractHex = (node: any): string | undefined => {
          const srgb = node?.['a:srgbClr']?.[0]?.$?.val;
          if (srgb) return `#${String(srgb).toUpperCase()}`;
          const sys = node?.['a:sysClr']?.[0]?.$?.lastClr;
          if (sys) return `#${String(sys).toUpperCase()}`;
          return undefined;
        };
        if (clrScheme) {
          const candidates: string[] = [];
          const keys = ['a:accent1','a:accent2','a:accent3','a:accent4','a:accent5','a:accent6','a:dk1','a:lt1','a:dk2','a:lt2','a:hlink','a:folHlink'];
          keys.forEach((k) => {
            const node = (clrScheme as any)[k]?.[0];
            const hex = extractHex(node);
            if (hex) candidates.push(hex);
          });
          if (candidates.length > 0) {
            styles.colorScheme = Array.from(new Set(candidates));
          }
        }

        // Извлечение шрифтов
        const fontScheme = (themeResult as any)?.['a:theme']?.['a:themeElements']?.[0]?.['a:fontScheme']?.[0];
        if (fontScheme) {
          const majorLatin = fontScheme?.['a:majorFont']?.[0]?.['a:latin']?.[0]?.$?.typeface;
          const minorLatin = fontScheme?.['a:minorFont']?.[0]?.['a:latin']?.[0]?.$?.typeface;
          const fonts: string[] = [];
          if (majorLatin) fonts.push(majorLatin);
          if (minorLatin) fonts.push(minorLatin);
          if (fonts.length > 0) {
            styles.fontFamilies = Array.from(new Set(fonts));
          }
        }
      }

      // Парсим мастер-слайды
      const mastersDir = path.join(extractDir, 'ppt', 'slideMasters');
      if (fs.existsSync(mastersDir)) {
        const masterFiles = fs.readdirSync(mastersDir).filter(f => f.endsWith('.xml'));
        styles.masterLayouts = masterFiles.map(f => f.replace('.xml', ''));
      }

    } catch (error) {
      console.warn('Failed to parse styles:', error);
    }

    return styles;
  }

  /**
   * Извлекает переменные из всех слайдов
   */
  private extractVariables(slides: TemplateSlide[]): TemplateVariable[] {
    const variableMap = new Map<string, TemplateVariable>();

    slides.forEach(slide => {
      slide.variables.forEach(varName => {
        if (!variableMap.has(varName)) {
          variableMap.set(varName, {
            name: varName,
            type: 'text', // TODO: определить тип по контексту
            placeholder: `{{${varName}}}`,
            defaultValue: '',
            required: true
          });
        }
      });
    });

    return Array.from(variableMap.values());
  }

  /**
   * Применяет данные к шаблону
   */
  async applyTemplateData(template: ParsedTemplate, data: TemplateDataBinding): Promise<ParsedTemplate> {
    console.log('🔄 Applying data to template:', template.templateId);
    console.log('📊 Data keys:', Object.keys(data));

    const processedTemplate = JSON.parse(JSON.stringify(template)); // Deep clone

    // Обрабатываем каждый слайд
    processedTemplate.slides = processedTemplate.slides.map((slide: any) => {
      return {
        ...slide,
        content: slide.content.map((content: any) => {
          let processedContent = content.content;
          
          // Заменяем переменные на реальные данные
          content.variables.forEach((varName: string) => {
            const value = data[varName];
            if (value !== undefined) {
              const patterns = [
                new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, 'g'),
                new RegExp(`\\$\\{\\s*${varName}\\s*\\}`, 'g')
              ];
              
              patterns.forEach(pattern => {
                processedContent = processedContent.replace(pattern, String(value));
              });
            }
          });

          return {
            ...content,
            content: processedContent
          };
        })
      };
    });

    // Обновляем метаданные
    processedTemplate.metadata = {
      ...processedTemplate.metadata,
      processedAt: new Date().toISOString(),
      dataApplied: true,
      dataKeys: Object.keys(data)
    };

    console.log('✅ Template data application completed');
    return processedTemplate;
  }

  /**
   * Конвертирует обработанный шаблон в формат для презентации
   */
  convertToPresentation(processedTemplate: ParsedTemplate, presentationTitle: string): any {
    console.log('🔄 Converting template to presentation format');

    const slides = processedTemplate.slides.map((slide, index) => ({
      id: (index + 1).toString(),
      title: slide.title || `Slide ${index + 1}`,
      content: slide.content
        .filter(c => c.type === 'text' && c.content.trim())
        .map(c => c.content.trim())
        .filter(c => c.length > 0),
      layout: slide.layout,
      speakerNotes: `Generated from template: ${processedTemplate.name}`
    }));

    return {
      id: processedTemplate.templateId,
      title: presentationTitle,
      subtitle: `Based on template: ${processedTemplate.name}`,
      author: 'Template System',
      audience: 'general',
      style: 'template',
      slides,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...processedTemplate.metadata,
        convertedAt: new Date().toISOString(),
        originalTemplate: processedTemplate.name
      }
    };
  }

  /**
   * Сохраняет шаблон для дальнейшего использования
   */
  private async saveTemplate(template: ParsedTemplate): Promise<void> {
    const templatePath = path.join(this.tempDir, `${template.templateId}.json`);
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
    console.log('💾 Template saved:', templatePath);
  }

  /**
   * Загружает сохраненный шаблон
   */
  async loadTemplate(templateId: string): Promise<ParsedTemplate | null> {
    const templatePath = path.join(this.tempDir, `${templateId}.json`);
    
    if (!fs.existsSync(templatePath)) {
      return null;
    }

    try {
      const templateData = fs.readFileSync(templatePath, 'utf8');
      return JSON.parse(templateData);
    } catch (error) {
      console.error('Failed to load template:', error);
      return null;
    }
  }

  /**
   * Получает список доступных шаблонов
   */
  async getAvailableTemplates(): Promise<ParsedTemplate[]> {
    const templates: ParsedTemplate[] = [];
    
    if (!fs.existsSync(this.tempDir)) {
      return templates;
    }

    const files = fs.readdirSync(this.tempDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const templateId = file.replace('.json', '');
        const template = await this.loadTemplate(templateId);
        if (template) {
          templates.push(template);
        }
      }
    }

    return templates;
  }

  /**
   * Очищает временные файлы
   */
  async cleanup(templateId?: string): Promise<void> {
    if (templateId) {
      // Очищаем конкретный шаблон
      const templateDir = path.join(this.tempDir, templateId);
      const templateFile = path.join(this.tempDir, `${templateId}.json`);
      
      if (fs.existsSync(templateDir)) {
        fs.rmSync(templateDir, { recursive: true, force: true });
      }
      
      if (fs.existsSync(templateFile)) {
        fs.unlinkSync(templateFile);
      }
    } else {
      // Очищаем все временные файлы старше 24 часов
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
      
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        
        files.forEach(file => {
          const filePath = path.join(this.tempDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            if (stats.isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(filePath);
            }
          }
        });
      }
    }
  }
}

export const templateProcessor = new TemplateProcessorService();
