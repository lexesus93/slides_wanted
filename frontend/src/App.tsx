import React, { useState } from 'react'
import AITester from './components/AITester'
import PresentationCreator from './components/PresentationCreator'
import PresentationViewer from './components/PresentationViewer'
import StatusChecker from './components/StatusChecker'
import { Presentation } from './types/presentation'
import './App.css'

function App() {
  const [showAITester, setShowAITester] = useState(false)
  const [showPresentationCreator, setShowPresentationCreator] = useState(false)
  const [currentPresentation, setCurrentPresentation] = useState<Presentation | null>(null)

  const handleCreatePresentation = () => {
    setShowPresentationCreator(true)
  }

  const handlePresentationCreated = (presentation: Presentation) => {
    setCurrentPresentation(presentation)
    setShowPresentationCreator(false)
  }

  const handleTestAI = () => {
    console.log('App: Открываем AI Tester...');
    setShowAITester(true);
    console.log('App: AI Tester должен быть открыт:', true);
  }

  return (
    <div className="App">
      {currentPresentation ? (
        <PresentationViewer 
          presentation={currentPresentation}
          onClose={() => setCurrentPresentation(null)}
          onEdit={() => {
            setShowPresentationCreator(true)
          }}
        />
      ) : (
        <div className="hero">
          <h1>🎯 Slides Wanted</h1>
          <p>AI-Powered Presentation Builder</p>
          <StatusChecker />
          <div className="actions">
            <button className="btn-primary" onClick={handleCreatePresentation}>
              🎯 Создать презентацию
            </button>
            <button className="btn-secondary" onClick={handleTestAI}>
              🧪 Тест AI API
            </button>
          </div>
        </div>
      )}

      {showAITester && (
        <AITester onClose={() => setShowAITester(false)} />
      )}

      {showPresentationCreator && (
        <PresentationCreator 
          onClose={() => setShowPresentationCreator(false)}
          onPresentationCreated={handlePresentationCreated}
          existingPresentation={currentPresentation}
        />
      )}
    </div>
  )
}

export default App
