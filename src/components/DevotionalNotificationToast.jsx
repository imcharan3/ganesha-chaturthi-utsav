import React, { useState, useEffect } from 'react';
import { Bell, BellRing, WifiOff, RefreshCw, X, MessageSquare, Sparkles, Trophy, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { hasNotificationPermission, requestNotificationPermission } from '../utils/notifications';
import { getOfflineQueue, syncOfflineActions } from '../utils/offlineStorage';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DevotionalNotificationToast = ({ onSwitchTab }) => {
  const { adminToken } = useAuth();
  const [activeToast, setActiveToast] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(getOfflineQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState(null);

  useEffect(() => {
    // 1. Check Notification Permissions after 3 seconds of use
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const hasPerm = hasNotificationPermission();
        const dismissed = localStorage.getItem('ganesh_notif_prompt_dismissed');
        if (!hasPerm && Notification.permission !== 'denied' && !dismissed) {
          setShowPermissionPrompt(true);
        }
      }
    }, 3000);

    // 2. Online / Offline Network Listeners
    const handleOnline = async () => {
      setIsOffline(false);
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        setIsSyncing(true);
        try {
          const res = await syncOfflineActions(api, adminToken);
          if (res.syncedCount > 0) {
            setSyncSuccessToast(`🌐 తిరిగి ఆన్‌లైన్‌లోకి వచ్చారు! ${res.syncedCount} ఆఫ్‌లైన్ మార్పులు సర్వర్‌తో సింక్ చేయబడ్డాయి.`);
            setTimeout(() => setSyncSuccessToast(null), 5000);
          }
        } catch (e) {
          console.error('Auto sync error:', e);
        } finally {
          setIsSyncing(false);
          setPendingSyncCount(getOfflineQueue().length);
        }
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleQueueUpdated = (e) => {
      setPendingSyncCount(e.detail?.count || getOfflineQueue().length);
    };

    const handleToastAlert = (e) => {
      setActiveToast(e.detail);
      setTimeout(() => {
        setActiveToast(prev => (prev?.id === e.detail?.id ? null : prev));
      }, 7000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-updated', handleQueueUpdated);
    window.addEventListener('devotional-toast-alert', handleToastAlert);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-updated', handleQueueUpdated);
      window.removeEventListener('devotional-toast-alert', handleToastAlert);
    };
  }, [adminToken]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setShowPermissionPrompt(false);
  };

  const handleDismissPrompt = () => {
    setShowPermissionPrompt(false);
    localStorage.setItem('ganesh_notif_prompt_dismissed', 'true');
  };

  const handleManualSync = async () => {
    if (isSyncing || isOffline) return;
    setIsSyncing(true);
    try {
      const res = await syncOfflineActions(api, adminToken);
      if (res.syncedCount > 0) {
        setSyncSuccessToast(`✅ ${res.syncedCount} ఆఫ్‌లైన్ మార్పులు సర్వర్‌తో విజయవంతంగా సింక్ చేయబడ్డాయి!`);
        setTimeout(() => setSyncSuccessToast(null), 4000);
      }
    } finally {
      setIsSyncing(false);
      setPendingSyncCount(getOfflineQueue().length);
    }
  };

  const getToastIcon = (title = '') => {
    if (title.includes('ఆక్షన్') || title.includes('Auction') || title.includes('Bid')) {
      return <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />;
    }
    if (title.includes('విరాళం') || title.includes('Donation') || title.includes('చందా')) {
      return <HeartHandshake className="w-5 h-5 text-saffron-400" />;
    }
    return <MessageSquare className="w-5 h-5 text-amber-300" />;
  };

  return (
    <>
      {/* 1. Offline Mode Status Bar */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border-b border-amber-500/50 py-1.5 px-3 text-center flex items-center justify-center gap-2 text-xs font-bold text-amber-200 shadow-lg animate-in slide-in-from-top duration-200">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>ఆఫ్‌లైన్ మోడ్ (Offline Mode) • సేవ్ చేసిన డేటా కనిపిస్తోంది</span>
          {pendingSyncCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-[10px] text-amber-300 border border-amber-400/40">
              {pendingSyncCount} మార్పులు సింక్ కోసం సిద్ధంగా ఉన్నాయి
            </span>
          )}
        </div>
      )}

      {/* 2. Manual Sync Floating Badge if Online with Pending Items */}
      {!isOffline && pendingSyncCount > 0 && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-saffron-600 text-amber-950 font-extrabold text-xs shadow-gold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'సింక్ అవుతోంది...' : `సింక్ చేయండి (${pendingSyncCount})`}</span>
          </button>
        </div>
      )}

      {/* 3. Sync Success Floating Toast */}
      {syncSuccessToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-emerald-950/95 border-2 border-emerald-500 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-emerald-100 text-xs animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold flex-1">{syncSuccessToast}</span>
          <button onClick={() => setSyncSuccessToast(null)} className="p-1 text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Devotional Live Notification Toast */}
      {activeToast && (
        <div 
          onClick={() => {
            if (activeToast.tab && onSwitchTab) {
              onSwitchTab(activeToast.tab);
            }
            setActiveToast(null);
          }}
          className="fixed top-16 right-3 left-3 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-gradient-to-r from-[#2a0f06] via-[#1f0a04] to-[#140502] border-2 border-amber-400/90 rounded-2xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.9)] backdrop-blur-md cursor-pointer hover:border-amber-300 transition-all animate-in slide-in-from-top duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/30 to-saffron-500/20 border border-amber-400/40 shrink-0 shadow-inner">
              {getToastIcon(activeToast.title)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <h4 className="text-xs font-black text-amber-200 truncate gold-gradient-text">
                  {activeToast.title}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveToast(null);
                  }}
                  className="p-0.5 rounded-full text-amber-400/70 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-amber-100/90 leading-snug line-clamp-2">
                {activeToast.body}
              </p>
              <span className="text-[10px] text-amber-400/70 font-semibold mt-1 inline-block">
                చూడటానికి ఇక్కడ నొక్కండి (Tap to view) ➔
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Permission Request Bar */}
      {showPermissionPrompt && (
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-40 bg-gradient-to-r from-[#240e06] to-[#160602] border border-amber-400/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-1.5 rounded-xl bg-amber-500 text-amber-950 font-bold shrink-0">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1">
              <h5 className="text-xs font-bold text-amber-100">లైవ్ నోటిఫికేషన్‌లు (Live Alerts)</h5>
              <p className="text-[10px] text-amber-300/80">లడ్డూ ఆక్షన్ బిడ్లు & పూజ సమయాల అలర్ట్స్ పొందండి</p>
            </div>
            <button onClick={handleDismissPrompt} className="text-amber-400/60 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleRequestPermission}
              className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-extrabold text-xs shadow-gold hover:brightness-110 active:scale-95 transition-all"
            >
              అనుమతించు (Allow Alerts)
            </button>
            <button
              onClick={handleDismissPrompt}
              className="px-3 py-1.5 rounded-xl bg-black/40 text-amber-300/80 text-xs hover:bg-black/60 transition-colors"
            >
              వద్దు (Later)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
