import React, { useState } from 'react';
import { askAI } from '../services/aiService';

async function handleUserQuestion(question: string) {
  const answer = await askAI(question);
  console.log('AI Answer:', answer);
  return answer;
}

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);

  const toggleListening = async () => {
    const nextState = !isListening;
    setIsListening(nextState);
    if (nextState) {
      const answer = await handleUserQuestion("Hello Maya!");
      if (answer) {
        setAiAnswer(answer);
      }
    }
  };
  
  return (
    <div 
      style={{ 
        width: 80, 
        height: 80, 
        borderRadius: '50%',
        background: isListening ? '#FF6B6B' : '#6C63FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 30,
        cursor: 'pointer',
        boxShadow: '0 0 20px rgba(108,99,255,0.5)',
        transition: 'all 0.3s'
      }}
      onClick={toggleListening}
      title={aiAnswer || 'Click to talk to Maya'}
    >
      {isListening ? '🎤' : '🤖'}
    </div>
  );
};

export default App;
