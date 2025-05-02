/**
 * Utility functions for working with captions and translations
 */

// List of supported languages and their codes
export const SUPPORTED_LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'German', code: 'de' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Italian', code: 'it' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Russian', code: 'ru' },
  { name: 'Korean', code: 'ko' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Dutch', code: 'nl' },
  { name: 'Swedish', code: 'sv' },
  { name: 'Turkish', code: 'tr' },
];

/**
 * Get language name from language code
 */
export function getLanguageName(code: string): string {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language ? language.name : code.toUpperCase();
}

/**
 * Format a translation error in a user-friendly way
 */
export function formatTranslationError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('403')) {
      return 'API key doesn\'t have access to translation. Enable "Cloud Translation API" in Google Cloud Console.';
    }
    
    if (error.message.includes('429')) {
      return 'Translation limit reached. Try again later.';
    }
    
    if (error.message.includes('Invalid') || error.message.includes('Bad request')) {
      return 'Invalid translation request. Please check language settings.';
    }
    
    return error.message;
  }
  
  return 'Unknown translation error';
}

/**
 * Check if translation API is properly configured
 */
export function isTranslationConfigured(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY;
}

/**
 * Get browser speech recognition supported languages
 */
export function getSpeechRecognitionLanguages(): string[] {
  // Different browsers support different languages
  // This is just a common subset that most browsers support
  return [
    'en-US', // United States English
    'en-GB', // British English
    'es-ES', // Spanish
    'fr-FR', // French
    'de-DE', // German
    'it-IT', // Italian
    'ja-JP', // Japanese
    'zh-CN', // Chinese (Simplified)
  ];
} 