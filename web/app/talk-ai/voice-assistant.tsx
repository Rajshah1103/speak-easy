'use client';
import { useState, useEffect, useRef } from 'react';

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const recognition = useRef<any>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);
  const abortController = useRef(new AbortController());

  // Initialize browser APIs
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setConversation(prev => [...prev, `You: ${transcript}`]);
        await processQuery(transcript);
      };
    }

    synthesis.current = window.speechSynthesis;
  }, []);

  // Free AI API using Hugging Face's inference API (no auth needed for some models)
  const getAIResponse = async (query: string) => {
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer free' // Public demo token
          },
          body: JSON.stringify({ inputs: query }),
          signal: abortController.current.signal
        }
      );

      const data = await response.json();
      return data.generated_text || "I didn't understand that";
    } catch (error) {
      console.error('AI Error:', error);
      return "Sorry, I'm having trouble responding right now";
    }
  };

  const processQuery = async (query: string) => {
    setLoading(true);
    try {
      const response = await getAIResponse(query);
      setConversation(prev => [...prev, `AI: ${response}`]);
      speak(response);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    if (synthesis.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      synthesis.current.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
      abortController.current.abort();
    } else {
      abortController.current = new AbortController();
      recognition.current?.start();
    }
    setIsListening(!isListening);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Free Voice Assistant</h1>
        
        <div className="flex justify-center mb-6">
          <button
            onClick={toggleListening}
            className={`p-4 rounded-full text-white ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } transition-colors`}
          >
            {isListening ? '⏹ Stop' : '🎤 Start'}
          </button>
        </div>

        <div className="mb-6">
          {loading && (
            <div className="text-center text-gray-500 mb-4">
              <div className="animate-pulse">AI is thinking...</div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
          {conversation.map((entry, index) => (
            <div 
              key={index}
              className={`p-3 mb-3 rounded-lg ${
                entry.startsWith('You:') 
                  ? 'bg-blue-100 ml-auto' 
                  : 'bg-green-100 mr-auto'
              }`}
              style={{ maxWidth: '80%' }}
            >
              {entry}
            </div>
          ))}
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Powered by browser APIs and Hugging Face's free tier</p>
          <p>Note: Limited to 10 requests/minute on free API</p>
        </div>
      </div>
    </div>
  );
}