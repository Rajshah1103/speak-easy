'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';

const COMMANDS = [
  { 
    phrases: { en: 'go home', hi: 'घर जाएं' },
    path: '/',
    feedback: { en: 'Navigating home', hi: 'मुखपृष्ठ पर जा रहे हैं' }
  },
  { 
    phrases: { en: 'go to courses', hi: 'पाठ्यक्रम पर जाएं' },
    path: '/courses',
    feedback: { en: 'Navigating to courses', hi: 'पाठ्यक्रम पर जा रहे हैं' }
  },
  { 
    phrases: { en: 'go to leaderboard', hi: 'लीडरबोर्ड पर जाएं' },
    path: '/leaderboard',
    feedback: { en: 'Navigating to leaderboard', hi: 'लीडरबोर्ड पर जा रहे हैं' }
  },
  { 
    phrases: { en: 'go to quests', hi: 'क्वेस्ट पर जाएं' },
    path: '/quests',
    feedback: { en: 'Navigating to quests', hi: 'क्वेस्ट पर जा रहे हैं' }
  },
  { 
    phrases: { en: 'go to shop', hi: 'दुकान पर जाएं' },
    path: '/shop',
    feedback: { en: 'Navigating to shop', hi: 'दुकान पर जा रहे हैं' }
  },
  { 
    phrases: { en: 'go back', hi: 'पीछे जाएं' },
    action: 'back',
    feedback: { en: 'Going back', hi: 'पीछे जा रहे हैं' }
  },
  { 
    phrases: { en: 'go forward', hi: 'आगे जाएं' },
    action: 'forward',
    feedback: { en: 'Going forward', hi: 'आगे जा रहे हैं' }
  }
];

export const VoiceRouter = () => {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'en'|'hi'>('en');
  const [lastCommand, setLastCommand] = useState('');
  const [feedback, setFeedback] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedLang = getCookie('voiceLang') as 'en'|'hi' || 'en';
    setLanguage(savedLang);
  }, []);

  useEffect(() => {
    const handleLanguageChange = (e: CustomEvent) => setLanguage(e.detail);
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language === 'en' ? 'en-US' : 'hi-IN';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length-1][0].transcript.toLowerCase();
      setLastCommand(transcript);
      processCommand(transcript);
    };

    recognition.onerror = (event) => setFeedback(`Error: ${event.error}`);
    if (isListening) {
      recognition.start();
      setFeedback(language === 'en' ? 'Listening...' : 'सुन रहे हैं...');
    } else {
      recognition.stop();
      setFeedback('');
    }

    return () => recognition.stop();
  }, [isListening, router, language]);

  const processCommand = (command: string) => {
    const currentPath = window.location.pathname;
    const matchedCommand = COMMANDS.find(cmd => command.includes(cmd.phrases[language]));

    if (matchedCommand) {
      if (matchedCommand.path) {
        router.push(matchedCommand.path);
        speak(matchedCommand.feedback[language]);
      } else if (matchedCommand.action === 'back') {
        router.back();
        speak(matchedCommand.feedback[language]);
      } else if (matchedCommand.action === 'forward') {
        router.forward();
        speak(matchedCommand.feedback[language]);
      }
    } else if (currentPath === '/courses') {
      const courseMatch = command.match(language === 'en' ? /select course (.+)/ : /कोर्स चुनें (.+)/);
      if (courseMatch) {
        const courseTitle = courseMatch[1].trim();
        window.dispatchEvent(new CustomEvent('courseSelected', { detail: courseTitle }));
        speak(language === 'en' ? `Selecting ${courseTitle}` : `${courseTitle} चुन रहे हैं`);
      }
    } else {
      speak(language === 'en' ? 'Command not recognized' : 'आदेश पहचाना नहीं गया');
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'en' ? 'en-US' : 'hi-IN';
      window.speechSynthesis.speak(utterance);
      setFeedback(text);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button onClick={() => setIsListening(!isListening)} className={`p-4 rounded-full ${isListening ? 'bg-red-500' : 'bg-blue-600'} text-white shadow-lg`}>
        {isListening ? '🛑' : '🎤'}
      </button>
      <div aria-live="polite" className="mt-2 p-2 bg-white rounded shadow max-w-xs">
        {feedback && <p className="text-sm">{feedback}</p>}
        {lastCommand && <p className="text-xs mt-1">Heard: "{lastCommand}"</p>}
      </div>
    </div>
  );
};