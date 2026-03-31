import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoCallProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const VideoCall: React.FC<VideoCallProps> = ({ roomName, displayName, onClose }) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const loadJitsiScript = () => {
      return new Promise<void>((resolve) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    };

    loadJitsiScript().then(() => {
      if (jitsiContainerRef.current) {
        const domain = 'meet.jit.si';
        const options = {
          roomName: `AuraFit_${roomName}`,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: displayName,
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'security'
            ],
          },
        };
        const newApi = new window.JitsiMeetExternalAPI(domain, options);
        
        newApi.addEventListeners({
          readyToClose: () => {
            onClose();
          },
          videoConferenceLeft: () => {
            onClose();
          },
        });

        setApi(newApi);
      }
    });

    return () => {
      if (api) {
        api.dispose();
      }
    };
  }, [roomName, displayName, onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        width: isMinimized ? '320px' : '100%',
        height: isMinimized ? '240px' : '100%',
        bottom: isMinimized ? '24px' : '0',
        right: isMinimized ? '24px' : '0',
        top: isMinimized ? 'auto' : '0',
        left: isMinimized ? 'auto' : '0',
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed z-[100] bg-black shadow-2xl overflow-hidden ${isMinimized ? 'rounded-2xl border-4 border-white' : ''}`}
    >
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
        >
          {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
        </button>
        <button 
          onClick={onClose}
          className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div ref={jitsiContainerRef} className="w-full h-full" />
      
      {isMinimized && (
        <div className="absolute inset-0 bg-transparent cursor-move" />
      )}
    </motion.div>
  );
};

export default VideoCall;
