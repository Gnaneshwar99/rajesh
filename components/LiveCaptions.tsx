import { useState, useEffect, useRef } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { cn } from '@/lib/utils';
import { translateCaption } from '@/actions/translate';
import { formatTranslationError } from '@/lib/caption-utils';

interface LiveCaptionsProps {
  languageCode?: string;
  isEnabled: boolean;
}

// Simple waiting message
const WAITING_MESSAGE = "Listening... speak to generate captions";
const MIC_ERROR_MESSAGE = "⚠️ Please unmute your microphone for captions";
const TRANSLATION_LOADING = "Translating with Gemini AI...";

const LiveCaptions = ({ 
  languageCode = 'en',
  isEnabled = false
}: LiveCaptionsProps) => {
  const [captions, setCaptions] = useState('');
  const [translatedCaptions, setTranslatedCaptions] = useState('');
  const [isWaiting, setIsWaiting] = useState(true);
  const [microphoneError, setMicrophoneError] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const captionsTimeout = useRef<NodeJS.Timeout | null>(null);
  const call = useCall();

  // Check if microphone is muted in the call
  const isMicrophoneMuted = call?.microphone.state.status === 'disabled';
  
  // Function to request microphone permissions separately from the call
  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneError(false);
      return true;
    } catch (error) {
      console.error('Microphone access denied:', error);
      setMicrophoneError(true);
      return false;
    }
  };

  // Clear captions after a delay if no new speech is detected
  const resetCaptionsAfterDelay = () => {
    if (captionsTimeout.current) {
      clearTimeout(captionsTimeout.current);
    }
    
    captionsTimeout.current = setTimeout(() => {
      setIsWaiting(true);
    }, 10000); // Reset to waiting state after 10 seconds of silence
  };

  // Handle translation for non-English languages
  useEffect(() => {
    const translateText = async () => {
      // Reset any previous translation errors
      setTranslationError(null);
      
      if (!captions) {
        setTranslatedCaptions('');
        return;
      }
      
      if (languageCode === 'en') {
        setTranslatedCaptions(captions);
        return;
      }
      
      try {
        setIsTranslating(true);
        console.log(`Translating text to ${languageCode}: "${captions}"`);
        
        const translated = await translateCaption({
          text: captions,
          targetLanguage: languageCode
        });
        
        console.log(`Translation result: "${translated}"`);
        
        // Only update if we got back an actual translation
        if (translated && translated !== captions) {
          setTranslatedCaptions(translated);
        } else {
          // If we got back the same text or empty, keep original
          console.warn('Translation returned unchanged text or empty string');
          setTranslatedCaptions(captions);
          
          // Check if the translation result starts with a language code indicator
          // This happens when the API key is missing
          if (translated.startsWith(`[${languageCode}]`)) {
            setTranslationError('API key missing or invalid. Please check your Google API key configuration.');
          }
        }
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedCaptions(captions); // Fallback to original text
        setTranslationError(formatTranslationError(error));
      } finally {
        setIsTranslating(false);
      }
    };
    
    if (captions) {
      translateText();
    } else {
      setTranslatedCaptions(''); // Clear translated captions when there's no input
    }
  }, [captions, languageCode]);

  // Set up and clean up speech recognition
  useEffect(() => {
    // Check if captioning is disabled
    if (!isEnabled) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
      return;
    }

    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      setCaptions('Speech recognition not supported in this browser. Try Chrome or Edge.');
      return;
    }

    // Set initial waiting state
    setIsWaiting(true);

    // Request microphone access first
    requestMicrophoneAccess().then((micAccessGranted) => {
      if (!micAccessGranted) {
        setCaptions(MIC_ERROR_MESSAGE);
        return;
      }

      // Initialize speech recognition
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        // Configure recognition settings
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Always use English for best results
        recognition.maxAlternatives = 1;

        // Handle speech results
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const results = event.results;
          if (results.length === 0) return;
          
          // Get only the most recent result
          const lastResult = results[results.length - 1];
          
          if (lastResult.isFinal) {
            // We have a final result, show it
            const transcript = lastResult[0].transcript.trim();
            
            if (transcript) {
              setCaptions(transcript);
              setIsWaiting(false);
              resetCaptionsAfterDelay();
            }
          }
        };

        // Handle errors
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          
          if (event.error === 'not-allowed') {
            setCaptions('Microphone access denied. Please allow microphone access.');
            setMicrophoneError(true);
          } else if (event.error === 'audio-capture') {
            setCaptions('No microphone detected or microphone is muted.');
            setMicrophoneError(true);
          } else if (event.error === 'no-speech') {
            // No speech detected, this is normal
            setIsWaiting(true);
          }
        };

        // Automatically restart when recognition ends
        recognition.onend = () => {
          if (isEnabled && recognitionRef.current) {
            try {
              // Small delay before restarting
              setTimeout(() => {
                if (recognitionRef.current) {
                  recognitionRef.current.start();
                }
              }, 300);
            } catch (e) {
              console.error('Failed to restart speech recognition:', e);
            }
          }
        };

        // Start recognition
        recognition.start();
      } catch (e) {
        console.error('Error setting up speech recognition:', e);
        setCaptions('Error initializing speech recognition. Please try a different browser.');
      }
    });
    
    // Clean up on component unmount or when disabled
    return () => {
      if (captionsTimeout.current) {
        clearTimeout(captionsTimeout.current);
      }
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (e) {
          console.error('Error during cleanup:', e);
        }
      }
    };
  }, [isEnabled]);

  // Effect to check microphone status from the call
  useEffect(() => {
    if (isMicrophoneMuted && isEnabled) {
      setMicrophoneError(true);
      setCaptions(MIC_ERROR_MESSAGE);
    } else if (isEnabled) {
      setMicrophoneError(false);
    }
  }, [isMicrophoneMuted, isEnabled]);

  // Don't render anything if captions are disabled
  if (!isEnabled) {
    return null;
  }
  
  // Get text to display based on language
  let messageToDisplay = languageCode === 'en' ? captions : translatedCaptions;
  
  if (microphoneError) {
    messageToDisplay = MIC_ERROR_MESSAGE;
  } else if (translationError) {
    // If there's a translation error but we still have fallback translation
    if (translatedCaptions && translatedCaptions !== captions) {
      messageToDisplay = translatedCaptions;
    } else {
      // Show translation error but keep showing captions
      messageToDisplay = `${captions} (Translation error: ${translationError})`;
    }
  } else if (isTranslating && languageCode !== 'en') {
    // If still translating, show the original text with indicator
    messageToDisplay = captions ? `${captions} (${TRANSLATION_LOADING})` : TRANSLATION_LOADING;
  } else if ((!messageToDisplay || messageToDisplay === '') && isWaiting) {
    messageToDisplay = WAITING_MESSAGE;
  }

  // Check if we need to show a language indicator for fallback translation
  const shouldShowLanguageIndicator = 
    languageCode !== 'en' && 
    translatedCaptions && 
    translatedCaptions.startsWith(`[${languageCode}]`);

  // Add AI indicator for translations  
  const isUsingAITranslation = 
    languageCode !== 'en' && 
    translatedCaptions && 
    !shouldShowLanguageIndicator;

  return (
    <div className="fixed bottom-32 left-0 right-0 z-50 mx-auto max-w-3xl">
      <div className={cn(
        "caption-container p-3 bg-black/80 text-white rounded-lg border border-white/20",
        "text-center animate-in fade-in duration-300 text-lg shadow-lg",
        (isWaiting && !messageToDisplay) && "opacity-70",
        microphoneError && "bg-red-900/90 border-red-500/50",
        isTranslating && "border-blue-500/50",
        translationError && "border-yellow-500/50",
        shouldShowLanguageIndicator && "border-purple-500/50",
        isUsingAITranslation && "border-green-500/50"
      )}>
        {shouldShowLanguageIndicator && (
          <div className="text-xs text-purple-300 mb-1">
            Using basic phrase translation
          </div>
        )}
        {isUsingAITranslation && !isTranslating && !translationError && (
          <div className="text-xs text-green-300 mb-1 flex items-center justify-center">
            <span className="mr-1">⚡</span>
            Translated by Gemini AI
          </div>
        )}
        {messageToDisplay || WAITING_MESSAGE}
      </div>
    </div>
  );
};

export default LiveCaptions; 