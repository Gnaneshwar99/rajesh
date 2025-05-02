'use server'

/**
 * This file contains server actions for translating captions in real-time
 * Uses Google's Gemini AI API for high-quality translations
 */

interface TranslateOptions {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

// Language codes mapped to their full names for Gemini API prompting
const LANGUAGE_NAMES: Record<string, string> = {
  "en": "English",
  "es": "Spanish",
  "fr": "French",
  "de": "German",
  "hi": "Hindi",
  "ja": "Japanese",
  "zh": "Chinese",
  "it": "Italian",
  "pt": "Portuguese",
  "ru": "Russian",
  "ko": "Korean",
  "ar": "Arabic",
  "nl": "Dutch",
  "sv": "Swedish",
  "tr": "Turkish"
};

// Basic translations for common phrases in different languages
// This is a fallback when Google API isn't available
const BASIC_TRANSLATIONS: Record<string, Record<string, string>> = {
  "hello": {
    "es": "hola",
    "fr": "bonjour",
    "de": "hallo",
    "hi": "नमस्ते",
    "ja": "こんにちは",
    "zh": "你好",
    "it": "ciao",
    "pt": "olá",
    "ru": "привет",
    "ko": "안녕하세요",
    "ar": "مرحبا",
    "nl": "hallo",
    "sv": "hej",
    "tr": "merhaba"
  },
  "goodbye": {
    "es": "adiós",
    "fr": "au revoir",
    "de": "auf wiedersehen",
    "hi": "अलविदा",
    "ja": "さようなら",
    "zh": "再见",
    "it": "arrivederci",
    "pt": "adeus",
    "ru": "до свидания",
    "ko": "안녕히 가세요",
    "ar": "وداعا",
    "nl": "tot ziens",
    "sv": "adjö",
    "tr": "güle güle"
  },
  "thanks": {
    "es": "gracias",
    "fr": "merci",
    "de": "danke",
    "hi": "धन्यवाद",
    "ja": "ありがとう",
    "zh": "谢谢",
    "it": "grazie",
    "pt": "obrigado",
    "ru": "спасибо",
    "ko": "감사합니다",
    "ar": "شكرا",
    "nl": "bedankt",
    "sv": "tack",
    "tr": "teşekkürler"
  },
  "yes": {
    "es": "sí",
    "fr": "oui",
    "de": "ja",
    "hi": "हां",
    "ja": "はい",
    "zh": "是的",
    "it": "sì",
    "pt": "sim",
    "ru": "да",
    "ko": "예",
    "ar": "نعم",
    "nl": "ja",
    "sv": "ja",
    "tr": "evet"
  },
  "no": {
    "es": "no",
    "fr": "non",
    "de": "nein",
    "hi": "नहीं",
    "ja": "いいえ",
    "zh": "不",
    "it": "no",
    "pt": "não",
    "ru": "нет",
    "ko": "아니요",
    "ar": "لا",
    "nl": "nee",
    "sv": "nej",
    "tr": "hayır"
  },
  "please": {
    "es": "por favor",
    "fr": "s'il vous plaît",
    "de": "bitte",
    "hi": "कृपया",
    "ja": "お願いします",
    "zh": "请",
    "it": "per favore",
    "pt": "por favor",
    "ru": "пожалуйста",
    "ko": "제발",
    "ar": "من فضلك",
    "nl": "alstublieft",
    "sv": "snälla",
    "tr": "lütfen"
  },
  "sorry": {
    "es": "lo siento",
    "fr": "désolé",
    "de": "entschuldigung",
    "hi": "माफ़ करें",
    "ja": "ごめんなさい",
    "zh": "对不起",
    "it": "scusa",
    "pt": "desculpe",
    "ru": "извините",
    "ko": "죄송합니다",
    "ar": "آسف",
    "nl": "sorry",
    "sv": "förlåt",
    "tr": "üzgünüm"
  },
  "good morning": {
    "es": "buenos días",
    "fr": "bonjour",
    "de": "guten morgen",
    "hi": "सुप्रभात",
    "ja": "おはようございます",
    "zh": "早上好",
    "it": "buongiorno",
    "pt": "bom dia",
    "ru": "доброе утро",
    "ko": "좋은 아침",
    "ar": "صباح الخير",
    "nl": "goedemorgen",
    "sv": "god morgon",
    "tr": "günaydın"
  },
  "good afternoon": {
    "es": "buenas tardes",
    "fr": "bon après-midi",
    "de": "guten nachmittag",
    "hi": "नमस्ते",
    "ja": "こんにちは",
    "zh": "下午好",
    "it": "buon pomeriggio",
    "pt": "boa tarde",
    "ru": "добрый день",
    "ko": "안녕하세요",
    "ar": "مساء الخير",
    "nl": "goedemiddag",
    "sv": "god eftermiddag",
    "tr": "iyi günler"
  },
  "good evening": {
    "es": "buenas noches",
    "fr": "bonsoir",
    "de": "guten abend",
    "hi": "शुभ संध्या",
    "ja": "こんばんは",
    "zh": "晚上好",
    "it": "buonasera",
    "pt": "boa noite",
    "ru": "добрый вечер",
    "ko": "안녕하세요",
    "ar": "مساء الخير",
    "nl": "goedenavond",
    "sv": "god kväll",
    "tr": "iyi akşamlar"
  },
  "how are you": {
    "es": "¿cómo estás?",
    "fr": "comment allez-vous?",
    "de": "wie geht es dir?",
    "hi": "आप कैसे हैं?",
    "ja": "お元気ですか？",
    "zh": "你好吗？",
    "it": "come stai?",
    "pt": "como vai você?",
    "ru": "как дела?",
    "ko": "어떻게 지내세요?",
    "ar": "كيف حالك؟",
    "nl": "hoe gaat het?",
    "sv": "hur mår du?",
    "tr": "nasılsın?"
  }
};

// Add common words for word-by-word translation
const COMMON_WORDS: Record<string, Record<string, string>> = {
  "the": {
    "es": "el/la", "fr": "le/la", "de": "der/die/das", "hi": "यह", 
    "ja": "その", "zh": "的", "it": "il/la", "pt": "o/a",
    "ru": "этот/эта", "ko": "그", "ar": "ال", "nl": "de/het"
  },
  "is": {
    "es": "es", "fr": "est", "de": "ist", "hi": "है", 
    "ja": "です", "zh": "是", "it": "è", "pt": "é",
    "ru": "является", "ko": "이다", "ar": "هو", "nl": "is"
  },
  "and": {
    "es": "y", "fr": "et", "de": "und", "hi": "और", 
    "ja": "と", "zh": "和", "it": "e", "pt": "e",
    "ru": "и", "ko": "그리고", "ar": "و", "nl": "en"
  },
  "to": {
    "es": "a", "fr": "à", "de": "zu", "hi": "को", 
    "ja": "に", "zh": "至", "it": "a", "pt": "para",
    "ru": "в", "ko": "에게", "ar": "إلى", "nl": "naar"
  },
  "in": {
    "es": "en", "fr": "dans", "de": "in", "hi": "में", 
    "ja": "で", "zh": "在", "it": "in", "pt": "em",
    "ru": "в", "ko": "에서", "ar": "في", "nl": "in"
  },
  "of": {
    "es": "de", "fr": "de", "de": "von", "hi": "का", 
    "ja": "の", "zh": "的", "it": "di", "pt": "de",
    "ru": "из", "ko": "의", "ar": "من", "nl": "van"
  },
  "for": {
    "es": "para", "fr": "pour", "de": "für", "hi": "के लिए", 
    "ja": "ために", "zh": "为", "it": "per", "pt": "para",
    "ru": "для", "ko": "위해", "ar": "ل", "nl": "voor"
  },
  "I": {
    "es": "yo", "fr": "je", "de": "ich", "hi": "मैं", 
    "ja": "私", "zh": "我", "it": "io", "pt": "eu",
    "ru": "я", "ko": "나", "ar": "أنا", "nl": "ik"
  },
  "you": {
    "es": "tú", "fr": "tu/vous", "de": "du/Sie", "hi": "तुम", 
    "ja": "あなた", "zh": "你", "it": "tu", "pt": "você",
    "ru": "ты/вы", "ko": "너", "ar": "أنت", "nl": "jij/u"
  },
  "we": {
    "es": "nosotros", "fr": "nous", "de": "wir", "hi": "हम", 
    "ja": "私たち", "zh": "我们", "it": "noi", "pt": "nós",
    "ru": "мы", "ko": "우리", "ar": "نحن", "nl": "wij"
  },
  "they": {
    "es": "ellos", "fr": "ils", "de": "sie", "hi": "वे", 
    "ja": "彼ら", "zh": "他们", "it": "loro", "pt": "eles",
    "ru": "они", "ko": "그들", "ar": "هم", "nl": "zij"
  },
  "have": {
    "es": "tener", "fr": "avoir", "de": "haben", "hi": "पास है", 
    "ja": "持っている", "zh": "有", "it": "avere", "pt": "ter",
    "ru": "иметь", "ko": "가지다", "ar": "لديه", "nl": "hebben"
  },
  "do": {
    "es": "hacer", "fr": "faire", "de": "tun", "hi": "करना", 
    "ja": "する", "zh": "做", "it": "fare", "pt": "fazer",
    "ru": "делать", "ko": "하다", "ar": "يفعل", "nl": "doen"
  },
  "not": {
    "es": "no", "fr": "ne pas", "de": "nicht", "hi": "नहीं", 
    "ja": "ない", "zh": "不", "it": "non", "pt": "não",
    "ru": "не", "ko": "않다", "ar": "لا", "nl": "niet"
  },
  "what": {
    "es": "qué", "fr": "quoi", "de": "was", "hi": "क्या", 
    "ja": "何", "zh": "什么", "it": "cosa", "pt": "o que",
    "ru": "что", "ko": "무엇", "ar": "ما", "nl": "wat"
  },
  "this": {
    "es": "esto", "fr": "ceci", "de": "dies", "hi": "यह", 
    "ja": "これ", "zh": "这", "it": "questo", "pt": "isto",
    "ru": "это", "ko": "이것", "ar": "هذا", "nl": "dit"
  },
  "that": {
    "es": "eso", "fr": "cela", "de": "das", "hi": "वह", 
    "ja": "それ", "zh": "那", "it": "quello", "pt": "aquilo",
    "ru": "то", "ko": "그것", "ar": "ذلك", "nl": "dat"
  },
  "with": {
    "es": "con", "fr": "avec", "de": "mit", "hi": "साथ", 
    "ja": "と", "zh": "与", "it": "con", "pt": "com",
    "ru": "с", "ko": "와", "ar": "مع", "nl": "met"
  },
  "can": {
    "es": "poder", "fr": "pouvoir", "de": "können", "hi": "सकना", 
    "ja": "できる", "zh": "能", "it": "potere", "pt": "poder",
    "ru": "мочь", "ko": "할 수 있다", "ar": "يستطيع", "nl": "kunnen"
  }
};

/**
 * Basic translation function as fallback when API is unavailable
 */
function basicTranslate(text: string, targetLanguage: string): string {
  // Convert to lowercase for matching
  const lowerText = text.toLowerCase().trim();
  
  // Check if we have the exact phrase in our dictionary
  if (BASIC_TRANSLATIONS[lowerText] && BASIC_TRANSLATIONS[lowerText][targetLanguage]) {
    return BASIC_TRANSLATIONS[lowerText][targetLanguage];
  }
  
  // Check if any of our known phrases are in the text
  for (const [phrase, translations] of Object.entries(BASIC_TRANSLATIONS)) {
    if (lowerText.includes(phrase) && translations[targetLanguage]) {
      // Replace the phrase in the original text
      const regex = new RegExp(phrase, 'gi');
      return text.replace(regex, translations[targetLanguage]);
    }
  }
  
  // Try word-by-word translation as a last resort
  const words = text.split(' ');
  let hasTranslatedAnyWord = false;
  
  const translatedWords = words.map(word => {
    const lowerWord = word.toLowerCase();
    
    // Check if we have a translation for this common word
    if (COMMON_WORDS[lowerWord] && COMMON_WORDS[lowerWord][targetLanguage]) {
      hasTranslatedAnyWord = true;
      return COMMON_WORDS[lowerWord][targetLanguage];
    }
    
    // Check if the word is part of our phrases dictionary
    if (BASIC_TRANSLATIONS[lowerWord] && BASIC_TRANSLATIONS[lowerWord][targetLanguage]) {
      hasTranslatedAnyWord = true;
      return BASIC_TRANSLATIONS[lowerWord][targetLanguage];
    }
    
    return word;
  });
  
  // If we managed to translate at least one word, return the translated text
  if (hasTranslatedAnyWord) {
    return translatedWords.join(' ');
  }
  
  // Return original text with language indicator if no match found
  return `[${targetLanguage}] ${text}`;
}

/**
 * Translates text using Google's Gemini API
 */
async function geminiTranslate(text: string, targetLanguage: string, sourceLanguage: string = "en"): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.warn("GOOGLE_AI_API_KEY not found, using fallback translation");
    return basicTranslate(text, targetLanguage);
  }

  try {
    // Construct the prompt for Gemini
    const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
    const sourceLangName = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage;
    
    const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. 
    Provide ONLY the translated text without any explanations, notes, or additional content:
    
    "${text}"`;

    // Make request to Gemini API
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error (${response.status}):`, errorText);
      return basicTranslate(text, targetLanguage);
    }

    const data = await response.json();
    console.log("Gemini API response:", JSON.stringify(data));

    // Extract the translated text from the response
    const translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (translatedText) {
      // Clean up the response (sometimes it comes with quotes)
      return translatedText.replace(/^["']|["']$/g, '').trim();
    } else {
      console.error("Invalid response structure from Gemini API:", data);
      return basicTranslate(text, targetLanguage);
    }
  } catch (error) {
    console.error("Error using Gemini for translation:", error);
    return basicTranslate(text, targetLanguage);
  }
}

/**
 * Translates text to the specified target language
 * Uses Gemini API for high-quality translations with fallback options
 */
export async function translateCaption({ 
  text, 
  targetLanguage,
  sourceLanguage = 'en'
}: TranslateOptions): Promise<string> {
  // If no text or target language matches source, return as is
  if (!text || targetLanguage === sourceLanguage) {
    return text;
  }

  console.log(`Translating from ${sourceLanguage} to ${targetLanguage}: "${text}"`);
  
  // Use Gemini API for translation
  try {
    const result = await geminiTranslate(text, targetLanguage, sourceLanguage);
    console.log(`Translation result: "${result}"`);
    return result;
  } catch (error) {
    console.error('Translation error:', error);
    // Return basic translation if Gemini fails
    return basicTranslate(text, targetLanguage);
  }
} 