import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export const AppSplashScreen = ({ isReady, onFinish }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show splash for minimum 1.8s for clean app opening experience
    const minTimer = setTimeout(() => {
      if (isReady) {
        setFading(true);
        setTimeout(() => {
          setVisible(false);
          if (onFinish) onFinish();
        }, 600); // fade duration
      }
    }, 1600);

    return () => clearTimeout(minTimer);
  }, [isReady, onFinish]);

  useEffect(() => {
    if (isReady && !fading) {
      const timer = setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          setVisible(false);
          if (onFinish) onFinish();
        }, 600);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isReady, fading, onFinish]);

  if (!visible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#120402] text-center px-4 transition-opacity duration-700 ease-out select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Devotional Radial Glow Behind Logo */}
      <div className="absolute w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-gradient-to-tr from-amber-500/25 via-saffron-600/30 to-crimson-600/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        
        {/* Transparent PNG Logo Container with Golden Aura Ring */}
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center animate-float">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40 animate-spin" style={{ animationDuration: '30s' }}></div>
          <div className="absolute inset-2 sm:inset-3 rounded-full border border-amber-500/30"></div>
          
          <img 
            src="/colony_logo.png" 
            alt="Vijaya Colony Ganesha Diaries Logo" 
            className="w-40 h-40 sm:w-52 sm:h-52 object-contain filter drop-shadow-[0_0_25px_rgba(245,158,11,0.75)]" 
          />
        </div>

        {/* Auspicious Loading Bar */}
        <div className="w-36 sm:w-48 h-1.5 bg-[#250d06] rounded-full overflow-hidden border border-amber-500/30 shadow-inner">
          <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-saffron-500 animate-marquee rounded-full shadow-gold"></div>
        </div>

      </div>
    </div>
  );
};
