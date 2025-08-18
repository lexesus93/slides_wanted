import React, { useState } from 'react'
import AITester from './components/AITester'
import StatusChecker from './components/StatusChecker'
import './App.css'

function App() {
  const [showAITester, setShowAITester] = useState(false)

  const handleCreatePresentation = () => {
    alert('🚧 Функция создания презентаций в разработке!')
  }

  const handleTestAI = () => {
    console.log('App: Открываем AI Tester...');
    setShowAITester(true);
    console.log('App: AI Tester должен быть открыт:', true);
  }

  return (
    <div className="App">
      <div className="hero">
        <h1>🎯 Slides Wanted</h1>
        <p>AI-Powered Presentation Builder</p>
        <StatusChecker />
        <div className="actions">
          <button className="btn-primary" onClick={handleCreatePresentation}>
            Создать презентацию
          </button>
          <button className="btn-secondary" onClick={handleTestAI}>
            🧪 Тест AI API
          </button>
        </div>
      </div>

      {showAITester && (
        <AITester onClose={() => setShowAITester(false)} />
      )}
    </div>
  )
}

export default App
