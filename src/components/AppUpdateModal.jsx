import React, { useState, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, X, ArrowUpCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { playTempleBell } from '../utils/audio';

export const CURRENT_APP_VERSION = '1.6';
export const CURRENT_VERSION_CODE = 7;

export const AppUpdateModal = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Check for updates on mount and when app resumes from background
    const checkForUpdates = async (force = false) => {
      try {
        const info = await api.getAppVersion();
        if (info) {
          if (force || info.versionCode > CURRENT_VERSION_CODE) {
            // Check if user dismissed this specific version in this session
            const dismissedVersion = sessionStorage.getItem('ganesh_dismissed_update_version');
            if (force || dismissedVersion !== String(info.versionCode)) {
              setUpdateInfo(info);
              setIsOpen(true);
              playTempleBell();
            }
          } else if (force) {
            alert(`✅ మీరు తాజా వెర్షన్ (v${CURRENT_APP_VERSION}) వాడుతున్నారు! మీ యాప్ అప్‌డేట్‌గా ఉంది.`);
          }
        }
      } catch (err) {
        console.warn('Update check failed:', err);
        if (force) {
          alert('ఆఫ్‌లైన్‌లో ఉన్నందున అప్‌డేట్ తనిఖీ చేయలేకపోయాము. దయచేసి ఇంటర్నెట్ కనెక్ట్ చేయండి.');
        }
      }
    };

    checkForUpdates();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates(false);
      }
    };

    const handleManualUpdateCheck = (e) => {
      checkForUpdates(e.detail?.force !== false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('check-for-app-update', handleManualUpdateCheck);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('check-for-app-update', handleManualUpdateCheck);
    };
  }, []);

  const handleStartUpdate = async () => {
    setIsDownloading(true);
    setDownloadProgress(10);

    // If PWA Service Worker is waiting, apply immediately
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
          return;
        }
      } catch (e) {}
    }

    // Direct APK Download & Install Trigger for Android
    const rawApkUrl = updateInfo?.apkUrl || '/Ganesha_Diaries_2026.apk';
    const downloadUrl = rawApkUrl.startsWith('http') 
      ? rawApkUrl 
      : `https://ganesha-chaturthi-utsav.onrender.com${rawApkUrl.startsWith('/') ? '' : '/'}${rawApkUrl}`;
    
    // Simulate smooth devotional progress
    let progress = 20;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 15;
      if (progress >= 95) {
        progress = 95;
        clearInterval(interval);
      }
      setDownloadProgress(progress);
    }, 250);

    try {
      // Trigger native download in Android system browser/installer
      if (typeof window !== 'undefined') {
        window.open(downloadUrl, '_system');
      }

      // Also fallback anchor trigger
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'Vijaya_Colony_Ganesha_Diaries.apk';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        clearInterval(interval);
        setDownloadProgress(100);
        setIsCompleted(true);
        setIsDownloading(false);
      }, 1500);
    } catch (err) {
      clearInterval(interval);
      setIsDownloading(false);
      if (typeof window !== 'undefined') {
        window.location.href = downloadUrl;
      }
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    if (updateInfo) {
      sessionStorage.setItem('ganesh_dismissed_update_version', String(updateInfo.versionCode));
    }
  };

  if (!isOpen || !updateInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#120402] border-2 border-amber-400/80 rounded-3xl p-6 max-w-sm sm:max-w-md w-full shadow-[0_0_50px_rgba(251,191,36,0.35)] relative text-center overflow-hidden">
        
        {/* Divine Background Glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-saffron-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close / Dismiss Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-amber-300 hover:text-white hover:bg-black/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 via-saffron-500 to-amber-600 p-1 shadow-gold flex items-center justify-center animate-bounce">
          <ArrowUpCircle className="w-9 h-9 text-amber-950" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-[11px] font-bold text-amber-300 mb-2">
          <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
          <span>కొత్త అప్‌డేట్ అందుబాటులో ఉంది (v{updateInfo.latestVersion})</span>
        </div>

        <h3 className="font-devotional text-xl sm:text-2xl font-black gold-gradient-text mb-2">
          {updateInfo.title || 'విజయ కాలనీ గణేష్ డైరీస్ అప్‌డేట్'}
        </h3>

        <p className="text-xs text-amber-200/80 mb-4 leading-relaxed">
          {updateInfo.releaseNotes || 'నవీకరించబడిన ఫీచర్లు, ఆఫ్‌లైన్ సింక్ & లైవ్ నోటిఫికేషన్‌లు జోడించబడ్డాయి. అప్‌డేట్ చేసి తాజా సమాచారాన్ని పొందండి.'}
        </p>

        {/* Download Progress Bar */}
        {isDownloading && (
          <div className="mb-4 bg-black/50 p-3 rounded-2xl border border-amber-500/30">
            <div className="flex items-center justify-between text-xs text-amber-300 font-bold mb-1.5">
              <span>డౌన్‌లోడ్ అవుతోంది (Downloading)...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-black/80 rounded-full overflow-hidden border border-amber-500/20">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 via-saffron-500 to-amber-600 transition-all duration-300 rounded-full"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {isCompleted ? (
          <div className="bg-emerald-950/70 border-2 border-emerald-500/70 p-4 rounded-2xl mb-4 text-emerald-200 text-xs flex flex-col items-center gap-2 animate-in zoom-in duration-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            <strong className="text-emerald-100 font-extrabold text-sm">డౌన్‌లోడ్ పూర్తయింది (Download Complete)!</strong>
            <div className="text-left bg-black/40 p-2.5 rounded-xl border border-emerald-500/30 text-[11px] text-emerald-100/90 leading-relaxed space-y-1">
              <p>👉 <strong>Step 1:</strong> మీ ఫోన్ పైభాగం నుండి నోటిఫికేషన్ బార్‌ను కిందకు లాగండి (Swipe down from top).</p>
              <p>👉 <strong>Step 2:</strong> <strong>"Download complete"</strong> నోటిఫికేషన్ పై క్లిక్ చేయండి.</p>
              <p>👉 <strong>Step 3:</strong> <strong>"Update"</strong> పై క్లిక్ చేస్తే కొత్త వెర్షన్ తక్షణమే ఇన్‌స్టాల్ అవుతుంది!</p>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {!isCompleted ? (
            <button
              onClick={handleStartUpdate}
              disabled={isDownloading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-600 text-amber-950 font-black text-sm shadow-gold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>అప్‌డేట్ అవుతోంది (Updating)...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ఇప్పుడే అప్‌డేట్ చేయండి (Update Now)</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleStartUpdate}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-emerald-950 font-black text-sm shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>మళ్లీ డౌన్‌లోడ్ చేయండి (Download Again)</span>
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="w-full py-2 text-xs text-amber-300/70 hover:text-amber-200 transition-colors"
          >
            తరువాత చేయండి (Remind Me Later)
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-amber-400/60">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80" />
          <span>Official Vijaya Colony Ganesha Utsav Package</span>
        </div>
      </div>
    </div>
  );
};
