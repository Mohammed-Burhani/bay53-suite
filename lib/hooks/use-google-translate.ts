/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';

interface TranslationCache {
  [key: string]: string;
}

const cache: TranslationCache = {};

// Map language codes to Google Translate language codes
const languageCodeMap: Record<string, string> = {
  'EN': 'en',
  'TA': 'ta',
};

export const useGoogleTranslate = (text: string, targetLang: string = 'en') => {
  const [translatedText, setTranslatedText] = useState<string>(text);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Map the language code
    const mappedLang = languageCodeMap[targetLang.toUpperCase()] || targetLang.toLowerCase();

    // If target language is English or not set, return original text
    if (!mappedLang || mappedLang === 'en') {
      setTranslatedText(text);
      return;
    }

    const cacheKey = `${text}_${mappedLang}`;

    // Check cache first
    if (cache[cacheKey]) {
      setTranslatedText(cache[cacheKey]);
      return;
    }

    const translateText = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Using Google Translate API via client-side fetch
        const response = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${mappedLang}&dt=t&q=${encodeURIComponent(text)}`
        );

        if (!response.ok) {
          throw new Error('Translation failed');
        }

        const data = await response.json();
        const translated = data[0]?.map((item: any) => item[0]).join('') || text;

        // Cache the result
        cache[cacheKey] = translated;
        setTranslatedText(translated);
      } catch (err) {
        console.error('Translation error:', err);
        setError(err instanceof Error ? err.message : 'Translation failed');
        setTranslatedText(text); // Fallback to original text
      } finally {
        setIsLoading(false);
      }
    };

    translateText();
  }, [text, targetLang]);

  return { translatedText, isLoading, error };
};
