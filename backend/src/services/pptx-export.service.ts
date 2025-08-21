import pptxgen from 'pptxgenjs';
import * as fs from 'fs';
import * as path from 'path';
import { TemplateStyles } from './template-processor.service';

export interface Slide {
  title: string;
  content: string | string[] | any;
  layout?: string;
}

export interface Presentation {
  title: string;
  slides: Slide[];
  createdAt?: string;
}

export interface ExportThemeOptions {
  primaryColor?: string;
  textColor?: string;
  titleColor?: string;
  bulletColor?: string;
  accentColors?: string[];
  fontName?: string;
}

export class PPTXExportService {
  async generatePPTX(
    presentation: Presentation,
    options?: { theme?: ExportThemeOptions; templateStyles?: TemplateStyles }
  ): Promise<{ filePath: string; fileName: string }> {
    const pptx = new pptxgen();
    
    // Presentation properties (no branding)
    pptx.author = '';
    pptx.company = '';
    pptx.title = presentation.title;
    pptx.subject = '';
    
    // Define slide masters based on template styles if provided
    const defaultBackground = options?.theme?.primaryColor || 'FFFFFF';
    pptx.defineSlideMaster({ title: 'MASTER_SLIDE', background: { color: defaultBackground }, objects: [] });

    const masterNames: string[] = [];
    if (options?.templateStyles?.masterLayouts && options.templateStyles.masterLayouts.length > 0) {
      options.templateStyles.masterLayouts.forEach((_layoutId, index) => {
        const masterName = `MASTER_${index}`;
        masterNames.push(masterName);
        pptx.defineSlideMaster({
          title: masterName,
          background: { color: defaultBackground },
          objects: []
        });
      });
    }

    // Add title slide (no extra branding text)
    const titleMaster = masterNames[0] || 'MASTER_SLIDE';
    const titleSlide = pptx.addSlide({ masterName: titleMaster });
    titleSlide.addText(presentation.title, {
      x: 1,
      y: 2.5,
      w: 8,
      h: 2,
      fontSize: 32,
      bold: true,
      align: 'center',
      color: options?.theme?.titleColor || '333333',
      fontFace: options?.theme?.fontName
    });

    // Add content slides
    presentation.slides.forEach((slide, index) => {
      // Try to choose a master by layout type if available
      let masterName = masterNames[1] || masterNames[0] || 'MASTER_SLIDE';
      if (slide.layout === 'title') masterName = masterNames[0] || 'MASTER_SLIDE';
      const pptxSlide = pptx.addSlide({ masterName });
      this.addSlideContent(pptxSlide, slide, index + 1, options?.theme);
    });

    // Generate file name
    const sanitizedTitle = presentation.title
      .replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s]/gi, '_')
      .substring(0, 50); // Limit filename length
    const fileName = `${sanitizedTitle}_${Date.now()}.pptx`;
    
    // Create exports directory
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    const filePath = path.join(exportsDir, fileName);
    
    // Save to file using promise-based approach
    return new Promise((resolve, reject) => {
      pptx.writeFile({ fileName: filePath })
        .then(() => {
          console.log(`PPTX file generated successfully: ${filePath}`);
          resolve({ filePath, fileName });
        })
        .catch((error) => {
          console.error('PPTX generation failed:', error);
          reject(new Error(`Failed to generate PPTX file: ${error.message}`));
        });
    });
  }

  private addSlideContent(slide: any, content: Slide, slideNumber: number, theme?: ExportThemeOptions) {
    // Add slide title
    slide.addText(content.title || 'Untitled Slide', {
      x: 0.5,
      y: 1.0,
      w: 9,
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: theme?.titleColor || '333333',
      fontFace: theme?.fontName
    });

    // Process content - handle different data types
    let contentText: string;
    if (typeof content.content === 'string') {
      contentText = content.content;
    } else if (Array.isArray(content.content)) {
      contentText = content.content.join('\n');
    } else if (content.content && typeof content.content === 'object') {
      contentText = JSON.stringify(content.content, null, 2);
    } else {
      contentText = String(content.content || 'No content');
    }
    const contentLines = contentText.split('\n').filter(line => line.trim());
    
    if (contentLines.length === 1) {
      // Single paragraph
      slide.addText(contentText, {
        x: 0.5,
        y: 2.0,
        w: 9,
        h: 4,
        fontSize: 16,
        color: theme?.textColor || '444444',
        fontFace: theme?.fontName,
        valign: 'top'
      });
    } else {
      // Detect Markdown-like table
      const hasSecondLine = contentLines.length >= 2;
      const firstHasPipe = contentLines[0]?.includes?.('|') === true;
      const secondMatchesRule = hasSecondLine && typeof contentLines[1] === 'string' && /\|?\s*[-:]+\s*(\|\s*[-:]+\s*)+\|?/.test(contentLines[1]);
      const looksLikeTable = firstHasPipe && secondMatchesRule;
      if (looksLikeTable) {
        // Parse table
        const rows = contentLines
          .filter((l) => typeof l === 'string' && /\|/.test(l))
          .map((l) => (l || '').replace(/^\||\|$/g, '').split('|').map((c) => (c || '').trim()));
        // Draw simple table
        const numCols = Math.max(1, ...rows.map(r => (Array.isArray(r) ? r.length : 0)));
        const colW = 9 / Math.max(1, numCols);
        const startY = 2.0;
        const rowH = 0.5;
        rows.forEach((row, rIdx) => {
          (row || []).forEach((cell, cIdx) => {
            slide.addText(String(cell ?? ''), {
              x: 0.5 + cIdx * colW,
              y: startY + rIdx * rowH,
              w: colW,
              h: rowH,
              fontSize: 14,
              color: theme?.textColor || '444444',
              fontFace: theme?.fontName,
              align: 'left',
              valign: 'middle',
              fill: { color: rIdx === 0 ? (theme?.primaryColor || 'EEEEEE') : 'FFFFFF' },
              line: { color: theme?.textColor || '999999', width: 0.5 }
            });
          });
        });
      } else {
        // Multiple lines - create bullet points with hierarchical support
        const bulletPoints = contentLines.map(rawLine => {
          const line = String(rawLine ?? '');
          const mNum = line.match(/^(\s*)(\d+)\.\s+(.*)$/); // numbered list
          if (mNum && typeof mNum[1] === 'string') {
            const indentLevel = Math.min(Math.floor(mNum[1].length / 2), 5);
            return {
              text: String(mNum[3] ?? '').trim(),
              options: {
                bullet: { type: 'number' },
                indentLevel,
                fontSize: 16,
                color: theme?.bulletColor || theme?.textColor || '444444',
                fontFace: theme?.fontName
              }
            } as any;
          }

          const match = line.match(/^(\s*)([-•–*]?\s*)?(.*)$/);
          const leadingSpaces = match && typeof match[1] === 'string' ? match[1].length : 0;
          const textPart = match && typeof match[3] === 'string' ? match[3] : line;
          const indentLevel = Math.min(Math.floor(leadingSpaces / 2), 5);
          return {
            text: String(textPart || '').trim(),
            options: {
              bullet: true,
              indentLevel,
              fontSize: 16,
              color: theme?.bulletColor || theme?.textColor || '444444',
              fontFace: theme?.fontName
            }
          } as any;
        });

        slide.addText(bulletPoints as any, {
          x: 0.5,
          y: 2.0,
          w: 9,
          h: 4,
          color: theme?.textColor || '444444',
          valign: 'top'
        });
      }
    }

    // Add slide number
    slide.addText(`${slideNumber}`, {
      x: 9,
      y: 6.5,
      w: 0.5,
      h: 0.3,
      fontSize: 12,
      align: 'center',
      color: theme?.textColor || '666666',
      fontFace: theme?.fontName
    });
  }

  async getFileStats(filePath: string): Promise<{ exists: boolean; size: number }> {
    try {
      const stats = await fs.promises.stat(filePath);
      return { exists: true, size: stats.size };
    } catch (error) {
      return { exists: false, size: 0 };
    }
  }
}

// Export singleton instance
export const pptxExportService = new PPTXExportService();
