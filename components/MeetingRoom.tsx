'use client';
import { useState, useEffect } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, LayoutList, Subtitles, Mic, MicOff } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Loader from './Loader';
import EndCallButton from './EndCallButton';
import LiveCaptions from './LiveCaptions';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGUAGES, getLanguageName } from '@/lib/caption-utils';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const { useCallCallingState } = useCallStateHooks();
  const call = useCall();
  
  // Caption state
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
  const [captionLanguage, setCaptionLanguage] = useState('en');
  const [showMicReminder, setShowMicReminder] = useState(false);
  const [showLanguageNotice, setShowLanguageNotice] = useState<string | null>(null);

  // Check if microphone is muted
  const isMicrophoneMuted = call?.microphone.state.status === 'disabled';

  // Toggle captions on/off
  const toggleCaptions = () => {
    const newState = !isCaptionsEnabled;
    setIsCaptionsEnabled(newState);
    
    // Show microphone reminder if enabling captions while mic is muted
    if (newState && isMicrophoneMuted) {
      setShowMicReminder(true);
      // Hide reminder after 5 seconds
      setTimeout(() => setShowMicReminder(false), 5000);
    }
  };

  // Change the caption language
  const changeLanguage = (langCode: string) => {
    setCaptionLanguage(langCode);
    
    // Show a notification that language was changed
    const langName = getLanguageName(langCode);
    
    setShowLanguageNotice(`Captions now in ${langName}`);
    setTimeout(() => setShowLanguageNotice(null), 3000);
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (call) {
      if (isMicrophoneMuted) {
        call.microphone.enable();
      } else {
        call.microphone.disable();
      }
    }
  };

  // for more detail about types of CallingState see: https://getstream.io/video/docs/react/ui-cookbook/ringing-call/#incoming-call-panel
  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        <div
          className={cn('h-[calc(100vh-86px)] hidden ml-2', {
            'show-block': showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      </div>
      
      {/* Microphone reminder tooltip */}
      {showMicReminder && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-md z-50 animate-bounce">
          Please unmute your microphone for captions to work!
        </div>
      )}
      
      {/* Language change notification tooltip */}
      {showLanguageNotice && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-md z-50 animate-in fade-in">
          {showLanguageNotice}
        </div>
      )}
      
      {/* Live Captions Component - positioned over the video */}
      <LiveCaptions 
        isEnabled={isCaptionsEnabled} 
        languageCode={captionLanguage} 
      />
      
      {/* video layout and call controls */}
      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5">
        <CallControls onLeave={() => router.push(`/`)} />
        
        {/* Custom microphone toggle for emphasis */}
        <button 
          onClick={toggleMicrophone} 
          className={cn(
            "cursor-pointer rounded-2xl px-4 py-2 flex items-center gap-1",
            isMicrophoneMuted 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-green-600 hover:bg-green-700"
          )}
          title={isMicrophoneMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMicrophoneMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
          <span className="text-white text-xs font-medium ml-1">
            {isMicrophoneMuted ? "Unmute" : "Mute"}
          </span>
        </button>

        {/* Caption toggle button */}
        <button 
          onClick={toggleCaptions} 
          className={cn(
            "cursor-pointer rounded-2xl px-4 py-2 flex items-center gap-1",
            isCaptionsEnabled 
              ? "bg-blue-600 hover:bg-blue-700" 
              : "bg-[#19232d] hover:bg-[#4c535b]"
          )}
          title={isCaptionsEnabled ? "Turn off captions" : "Turn on captions"}
        >
          <Subtitles size={20} className="text-white" />
          <span className="text-white text-xs font-medium ml-1">
            {isCaptionsEnabled ? "CC On" : "CC Off"}
          </span>
        </button>

        {/* Caption language selector */}
        {isCaptionsEnabled && (
          <DropdownMenu>
            <div className="flex items-center">
              <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
                <span className="uppercase text-white">{getLanguageName(captionLanguage)}</span>
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white max-h-[400px] overflow-y-auto">
              <div className="px-2 py-1 text-xs text-blue-400 border-b border-gray-700 flex items-center">
                <span className="mr-1">⚡</span> 
                Powered by Gemini AI
              </div>
              {SUPPORTED_LANGUAGES.map((language) => (
                <div key={language.code}>
                  <DropdownMenuItem
                    onClick={() => changeLanguage(language.code)}
                    className={cn(
                      captionLanguage === language.code && 'bg-blue-800/30 font-bold',
                      'cursor-pointer hover:bg-blue-700/20'
                    )}
                  >
                    {language.name}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="border-dark-1" />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    setLayout(item.toLowerCase() as CallLayoutType)
                  }
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <CallStatsButton />
        <button onClick={() => setShowParticipants((prev) => !prev)}>
          <div className=" cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
            <Users size={20} className="text-white" />
          </div>
        </button>
        {!isPersonalRoom && <EndCallButton />}
      </div>
    </section>
  );
};

export default MeetingRoom;
