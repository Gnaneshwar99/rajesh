import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Subtitles, SubtitlesOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaptionSettingsProps {
  isCaptionsEnabled: boolean;
  onToggleCaptions: () => void;
  captionLanguage: string;
  onLanguageChange: (language: string) => void;
  className?: string;
}

// List of supported languages with their codes
const SUPPORTED_LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Telugu', code: 'te' },
  { name: 'Tamil', code: 'ta' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'German', code: 'de' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Chinese', code: 'zh' },
];

const CaptionSettings = ({
  isCaptionsEnabled,
  onToggleCaptions,
  captionLanguage,
  onLanguageChange,
  className,
}: CaptionSettingsProps) => {
  // Find the current language name based on code
  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === captionLanguage
  )?.name || 'English';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        onClick={onToggleCaptions}
        variant="ghost"
        size="sm"
        className="flex items-center gap-1.5"
        title={isCaptionsEnabled ? 'Turn off captions' : 'Turn on captions'}
      >
        {isCaptionsEnabled ? <SubtitlesOff size={18} /> : <Subtitles size={18} />}
        <span className="hidden sm:inline">{isCaptionsEnabled ? 'Hide' : 'Show'} Captions</span>
      </Button>

      {isCaptionsEnabled && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {currentLanguage}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SUPPORTED_LANGUAGES.map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => onLanguageChange(language.code)}
                className={cn(
                  'text-sm cursor-pointer',
                  captionLanguage === language.code && 'font-bold'
                )}
              >
                {language.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default CaptionSettings; 