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

      <div className="relative z-10 flex flex-col items-center space-y-6 max-w-sm">
        
        {/* Shlokam Header */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-950/70 border border-amber-500/30 text-[11px] sm:text-xs text-amber-300 font-semibold shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>॥ శ్రీ వరసిద్ధి వినాయక ప్రసన్నః ॥</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        {/* Transparent PNG Logo Container with Golden Aura Ring */}
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center animate-float">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40 animate-spin" style={{ animationDuration: '30s' }}></div>
          <div className="absolute inset-2 rounded-full border border-amber-500/30"></div>
          
          <img 
            src="/colony_logo.png" 
            alt="Vijaya Colony Ganesha Diaries Logo" 
            className="w-36 h-36 sm:w-44 sm:h-44 object-contain filter drop-shadow-[0_0_20px_rgba(245,158,11,0.65)]" 
          />
        </div>

        {/* Brand Titles */}
        <div className="space-y-1.5">
          <h1 className="font-devotional text-2xl sm:text-3xl font-extrabold gold-gradient-text tracking-wide">
            విజయ కాలనీ గణేష్ డైరీస్
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-amber-300 tracking-wider">
            VIJAYA COLONY GANESHA DIARIES
          </p>
          <p className="text-[11px] text-amber-400/70 pt-1">
            వినాయక చవితి ఉత్సవాలు 2026 • Live Portal
          </p>
        </div>

        {/* Auspicious Loading Bar */}
        <div className="w-36 sm:w-44 h-1.5 bg-[#250d06] rounded-full overflow-hidden border border-amber-500/30">
          <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-saffron-500 animate-marquee rounded-full shadow-gold"></div>
        </div>

      </div>

      {/* Footer Blessings */}
      <div className="absolute bottom-6 text-[11px] text-amber-400/60 font-medium">
        "సర్వేజనాః సుఖినోభవంతు • గణపతి బప్పా మోరియా 🚩"
      </div>
    </div>
  );
};
