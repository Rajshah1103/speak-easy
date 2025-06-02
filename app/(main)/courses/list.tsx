'use client';
import { useEffect, useRef, useState } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertUserProgress } from "@/actions/user-progress";
import { courses, userProgress } from "@/db/schema";
import { Card } from "./card";
import { getCookie } from 'cookies-next';
import { LanguageProvider } from '@/components/language-provider';

type ListProps = {
  courses: (typeof courses.$inferSelect)[];
  activeCourseId?: typeof userProgress.$inferSelect.activeCourseId;
};

export const List = ({ courses, activeCourseId }: ListProps) => {
  const initialLang = getCookie('voiceLang') as 'en'|'hi' || 'en';
  const [language, setLanguage] = useState<'en'|'hi'>('en');
  const [pending, startTransition] = useTransition();
  const speechTimeout = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true); // Track first render
  const router = useRouter();

  useEffect(() => {
    const savedLang = getCookie('voiceLang') as 'en'|'hi' || 'en';
    setLanguage(savedLang);
    
    const handleLanguageChange = (e: CustomEvent) => setLanguage(e.detail);
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
  }, []);

  useEffect(() => {

    if (isFirstRender.current && courses.length > 0) {
      const courseList = courses.map(c => c.title).join(', ');
      const message = language === 'en' 
        ? `Available courses: ${courseList}`
        : `उपलब्ध पाठ्यक्रम: ${courseList}`;
      speak(message);
      isFirstRender.current = false; // Set to false after first render
    }
  }, [courses, language]);

  const speak = (text: string) => {
    if (speechTimeout.current) clearTimeout(speechTimeout.current);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-US' : 'hi-IN';
    window.speechSynthesis.speak(utterance);
  };

  const onClick = async (id: number, isQuiz: boolean) => {
    if (pending) return;
    if (id === activeCourseId) {
      if(isQuiz) {
        return router.push('/learn')
      } else {
        return router.push(`/watch/${id}`)
      }
    }
    startTransition(() => {
      upsertUserProgress(id).catch(() => toast.error("Something went wrong."));
    });
  };

  useEffect(() => {
    const handleCourseSelected = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const requestedCourse = customEvent.detail.toLowerCase();
      const course = courses.find(c => c.title.toLowerCase() === requestedCourse);
      
      if (course) {
        speak(language === 'en' ? `Navigating to ${course.title}` : `${course.title} पर जा रहे हैं`);
        onClick(course.id, course.isQuiz);
      } else {
        speak(language === 'en' ? "Course not found" : "पाठ्यक्रम नहीं मिला");
      }
    };

    window.addEventListener('courseSelected', handleCourseSelected as EventListener);
    return () => window.removeEventListener('courseSelected', handleCourseSelected as EventListener);
  }, [courses, language]);

  return (
    <LanguageProvider initialLang={initialLang}>
      <div className="grid grid-cols-2 gap-4 pt-6 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
        {courses.map((course) => (
          <Card
            key={course.id}
            id={course.id}
            title={course.title}
            imageSrc={course.imageSrc}
            onClick={() => onClick(course.id, course.isQuiz)}
            disabled={pending}
            isActive={course.id === activeCourseId}
            isQuiz={course.isQuiz}
          />
        ))}
      </div>
    </LanguageProvider>
  );
};