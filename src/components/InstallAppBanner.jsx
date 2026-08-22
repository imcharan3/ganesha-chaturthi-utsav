import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Sparkles } from 'lucide-react';

export const InstallAppBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt event (Android / Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show install banner if not dismissed previously
      const dismissed = localStorage.getItem('ganesh_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS and not installed and not dismissed, show iOS tip
    if (isIosDevice && !localStorage.getItem('ganesh_pwa_dismissed')) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        alert('To install on iPhone/iPad: Tap the Share button (⎋) at the bottom of Safari, then tap "Add to Home Screen" (➕).');
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('ganesh_pwa_dismissed', 'true');
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom duration-300">
      <div className="bg-gradient-to-r from-[#2f1309] via-[#240e06] to-[#180702] border-2 border-amber-400/60 rounded-2xl p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center justify-between gap-3">
        
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-saffron-600 p-0.5 shadow-gold shrink-0">
            <img src="/colony_logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-[10px]" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h4 className="text-xs font-bold text-amber-100">గణేష్ యాప్ ఇన్‌స్టాల్ చేసుకోండి</h4>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <p className="text-[10px] text-amber-300/80">
              {isIOS ? 'Safari: Share ⎋ ➔ Add to Home Screen' : 'Install on phone for quick 1-tap access'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold text-xs shadow-gold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-amber-400/60 hover:text-amber-200"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
