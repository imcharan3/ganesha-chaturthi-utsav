import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Sparkles, QrCode, Share, PlusSquare, ArrowRight, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const InstallAppBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standaloneMode);
    if (standaloneMode) {
      setShowBanner(false);
      return;
    }

    // Detect Device OS
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    const androidDevice = /android/.test(ua);
    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handleOpenModalEvent = () => {
      setShowInstallModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('open-install-modal', handleOpenModalEvent);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-install-modal', handleOpenModalEvent);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // If native browser prompt is not ready, open visual guide modal
      setShowInstallModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('ganesh_pwa_banner_closed', 'true');
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:5173/';

  if (isStandalone) return null;

  return (
    <>
      {/* Floating Bottom App Install Bar */}
      {showBanner && (
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom duration-300">
          <div className="bg-gradient-to-r from-[#321308] via-[#240e06] to-[#160602] border-2 border-amber-400/80 rounded-2xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-md flex items-center justify-between gap-3">
            
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setShowInstallModal(true)}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-saffron-600 p-0.5 shadow-gold shrink-0">
                <img src="/colony_logo.png" alt="Vijaya Colony Logo" className="w-full h-full object-contain rounded-[10px]" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-extrabold text-amber-100 gold-gradient-text">విజయ కాలనీ గణేష్ డైరీస్ యాప్</h4>
                  <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-amber-300/80">
                  {isIOS ? 'iPhone: Safari ➔ Add to Home Screen' : 'Install on phone for 1-tap instant access 📲'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-600 text-amber-950 font-extrabold text-xs shadow-gold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-full text-amber-400/60 hover:text-amber-200"
                title="Dismiss"
                aria-label="Close install banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Interactive Mobile Installation Guide Modal */}
      {showInstallModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowInstallModal(false)}
        >
          <div 
            className="relative w-full max-w-md bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#120502] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-crimson-900 via-saffron-800 to-crimson-900 p-4 text-center relative border-b border-amber-500/30 shrink-0">
              <button
                onClick={() => setShowInstallModal(false)}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/40 text-amber-200 hover:text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-saffron-600 p-0.5 shadow-gold mx-auto mb-2">
                <img src="/colony_logo.png" alt="Logo" className="w-full h-full object-contain rounded-[14px]" />
              </div>
              <h3 className="font-devotional text-base sm:text-lg font-bold gold-gradient-text">
                విజయ కాలనీ గణేష్ డైరీస్ యాప్ ఇన్‌స్టాలేషన్
              </h3>
              <p className="text-xs text-amber-200/80">
                Install Vijaya Colony Ganesha Diaries App on your phone
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs">
              
              {/* Android Instructions */}
              <div className="bg-[#190703] border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
                <h4 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Android (Google Chrome):</span>
                </h4>
                <ol className="space-y-1.5 text-amber-200/90 pl-1 list-decimal list-inside">
                  <li>Open this page in <strong>Google Chrome</strong> on your phone.</li>
                  <li>Tap the <strong>3 dots (⋮)</strong> in the top-right corner.</li>
                  <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>The app will be installed with the Ganesha icon on your home screen!</li>
                </ol>
              </div>

              {/* iPhone / iOS Instructions */}
              <div className="bg-[#190703] border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
                <h4 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>iPhone / iPad (Apple Safari):</span>
                </h4>
                <ol className="space-y-1.5 text-amber-200/90 pl-1 list-decimal list-inside">
                  <li>Open this page in <strong>Safari</strong> browser.</li>
                  <li>Tap the <strong>Share button (⎋)</strong> at the bottom bar.</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen" (➕)</strong>.</li>
                  <li>Tap <strong>"Add"</strong> in top right. Done! 🎉</li>
                </ol>
              </div>

              {/* QR Code to scan with Phone */}
              <div className="bg-black/50 border border-amber-500/30 rounded-2xl p-3.5 text-center space-y-2 flex flex-col items-center">
                <p className="text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scan QR with Phone Camera to Open & Install:</span>
                </p>
                <div className="bg-white p-2.5 rounded-xl shadow-lg inline-block">
                  <QRCodeSVG value={currentUrl} size={130} />
                </div>
                <p className="text-[10px] text-amber-400/60 font-mono select-all break-all">
                  {currentUrl}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold text-xs hover:brightness-110 shadow-gold"
              >
                Got It / అర్థమైంది 👍
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
};
