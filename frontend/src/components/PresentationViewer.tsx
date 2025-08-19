import React, { useState } from 'react';
import { Presentation, Slide } from '../types/presentation';
import { apiService } from '../services/api';
import './PresentationViewer.css';

interface PresentationViewerProps {
  presentation: Presentation;
  onClose: () => void;
  onEdit?: () => void;
}

const PresentationViewer: React.FC<PresentationViewerProps> = ({ 
  presentation, 
  onClose, 
  onEdit 
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState<'pptx' | 'pdf' | null>(null);
  const [exportError, setExportError] = useState<string>('');

  const currentSlide = presentation.slides[currentSlideIndex];

  const nextSlide = () => {
    if (currentSlideIndex < presentation.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlideIndex(index);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleExportPPTX = async () => {
    setIsExporting('pptx');
    setExportError('');
    
    try {
      console.log('Exporting to PPTX:', presentation.title);
      console.log('Presentation data being sent:', presentation);
      const response = await apiService.exportToPPTX(presentation);
      console.log('PPTX export response:', response);
      
      console.log('Checking response conditions:', {
        success: response.success,
        hasData: !!response.data,
        hasDownloadUrl: response.data && 'downloadUrl' in response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
        fullData: response.data
      });

      if (response.success && response.data && response.data.downloadUrl) {
        console.log('All conditions met, proceeding with download...');
        const downloadUrl = response.data.downloadUrl.startsWith('http') 
          ? response.data.downloadUrl 
          : `http://localhost:3000${response.data.downloadUrl}`;
        const fileName = response.data.fileName || `${presentation.title}.pptx`;
        
        console.log('Download details:', { downloadUrl, fileName });
        
        // Прямое скачивание через создание ссылки
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('PPTX export completed successfully');
      } else {
        throw new Error(response.error || 'Failed to export PPTX');
      }
    } catch (error) {
      console.error('PPTX export failed:', error);
      setExportError(`Ошибка экспорта PPTX: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting('pdf');
    setExportError('');
    
    try {
      console.log('Exporting to PDF:', presentation.title);
      const response = await apiService.exportToPDF(presentation);
      console.log('PDF export response:', response);
      
      if (response.success && response.data && response.data.downloadUrl) {
        const downloadUrl = response.data.downloadUrl.startsWith('http') 
          ? response.data.downloadUrl 
          : `http://localhost:3000${response.data.downloadUrl}`;
        const fileName = response.data.fileName || `${presentation.title}.pdf`;
        
        // Прямое скачивание через создание ссылки
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('PDF export completed successfully');
      } else {
        throw new Error(response.error || 'Failed to export PDF');
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      setExportError(`Ошибка экспорта PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsExporting(null);
    }
  };

  const renderSlideContent = (slide: Slide) => {
    switch (slide.layout) {
      case 'title':
        return (
          <div className="slide-title">
            <h1>{slide.title}</h1>
            {slide.content.length > 0 && (
              <p className="subtitle">{slide.content[0]}</p>
            )}
          </div>
        );
      
      case 'content':
        return (
          <div className="slide-content">
            <h2>{slide.title}</h2>
            <ul className="content-list">
              {slide.content.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        );
      
      case 'two-column':
        const midPoint = Math.ceil(slide.content.length / 2);
        const leftColumn = slide.content.slice(0, midPoint);
        const rightColumn = slide.content.slice(midPoint);
        
        return (
          <div className="slide-two-column">
            <h2>{slide.title}</h2>
            <div className="columns">
              <div className="column">
                <ul>
                  {leftColumn.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="column">
                <ul>
                  {rightColumn.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      
      case 'quote':
        return (
          <div className="slide-quote">
            <h2>{slide.title}</h2>
            <blockquote>
              {slide.content[0]}
            </blockquote>
            {slide.content[1] && (
              <cite>— {slide.content[1]}</cite>
            )}
          </div>
        );
      
      case 'conclusion':
        return (
          <div className="slide-conclusion">
            <h2>{slide.title}</h2>
            <div className="conclusion-content">
              {slide.content.map((item, index) => (
                <div key={index} className="conclusion-item">
                  <span className="bullet">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="slide-content">
            <h2>{slide.title}</h2>
            <div className="content-text">
              {slide.content.join(' ')}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`presentation-viewer ${isFullscreen ? 'fullscreen' : ''}`}>
      {!isFullscreen && (
        <div className="viewer-header">
          <div className="presentation-info">
            <h3>{presentation.title}</h3>
            <span className="slide-counter">
              {currentSlideIndex + 1} из {presentation.slides.length}
            </span>
          </div>
          <div className="viewer-actions">
            <div className="export-buttons">
              <button 
                className="btn-export-pptx" 
                onClick={handleExportPPTX}
                disabled={isExporting !== null}
              >
                {isExporting === 'pptx' ? '⏳ Экспорт...' : '📄 PPTX'}
              </button>
              <button 
                className="btn-export-pdf" 
                onClick={handleExportPDF}
                disabled={isExporting !== null}
              >
                {isExporting === 'pdf' ? '⏳ Экспорт...' : '📋 PDF'}
              </button>
            </div>
            
            <div className="action-buttons">
              {onEdit && (
                <button className="btn-edit" onClick={onEdit}>
                  ✏️ Редактировать
                </button>
              )}
              <button className="btn-fullscreen" onClick={toggleFullscreen}>
                🔍 Полный экран
              </button>
              <button className="btn-close" onClick={onClose}>
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="viewer-main">
        <div className="slide-display">
          <div 
            className={`slide slide-${currentSlide.layout}`}
            style={{
              backgroundColor: currentSlide.backgroundColor || '#ffffff'
            }}
          >
            {renderSlideContent(currentSlide)}
          </div>
        </div>

        {!isFullscreen && (
          <div className="slide-navigation">
            <div className="nav-controls">
              <button 
                className="nav-btn" 
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
              >
                ← Назад
              </button>
              
              <span className="slide-info">
                Слайд {currentSlideIndex + 1}
              </span>
              
              <button 
                className="nav-btn" 
                onClick={nextSlide}
                disabled={currentSlideIndex === presentation.slides.length - 1}
              >
                Вперед →
              </button>
            </div>

            <div className="slide-thumbnails">
              {presentation.slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`thumbnail ${index === currentSlideIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                >
                  <div className="thumbnail-number">{index + 1}</div>
                  <div className="thumbnail-title">{slide.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isFullscreen && (
        <div className="fullscreen-controls">
          <button 
            className="fs-nav-btn" 
            onClick={prevSlide}
            disabled={currentSlideIndex === 0}
          >
            ←
          </button>
          
          <span className="fs-slide-counter">
            {currentSlideIndex + 1} / {presentation.slides.length}
          </span>
          
          <button 
            className="fs-nav-btn" 
            onClick={nextSlide}
            disabled={currentSlideIndex === presentation.slides.length - 1}
          >
            →
          </button>
          
          <button className="fs-exit-btn" onClick={toggleFullscreen}>
            ✕ Выйти
          </button>
        </div>
      )}

      {currentSlide.notes && !isFullscreen && (
        <div className="speaker-notes">
          <h4>📝 Заметки для выступающего:</h4>
          <p>{currentSlide.notes}</p>
        </div>
      )}

      {exportError && !isFullscreen && (
        <div className="export-error">
          <span className="error-icon">❌</span>
          <span className="error-text">{exportError}</span>
          <button 
            className="error-close"
            onClick={() => setExportError('')}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default PresentationViewer;
