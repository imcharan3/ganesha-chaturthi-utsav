import React, { useState, useEffect } from 'react';
import { 
  X, Shield, Lock, KeyRound, Settings, CheckCircle2, AlertCircle, Save, 
  Database, Download, Upload, Server, RefreshCw, Check, Sparkles, Wallet, BellRing, ArrowUpCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ExpenseManager } from './ExpenseManager';
import { showDevotionalNotification, requestNotificationPermission } from '../utils/notifications';

export const AdminModal = ({ isOpen, onClose, settings, donors = [], onRefreshSettings }) => {
  const { isAdmin, adminToken, login, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'expenses' | 'database'
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Settings Form
  const [utsavName, setUtsavName] = useState(settings?.utsavName || '');
  const [targetAmount, setTargetAmount] = useState(settings?.targetAmount || 70000);
  const [upiId, setUpiId] = useState(settings?.upiId || 'charanadishti123@okaxis');
  const [location, setLocation] = useState(settings?.location || '');
  const [contactPhone, setContactPhone] = useState(settings?.contactPhone || '');
  const [startDate, setStartDate] = useState(settings?.startDate || '2026-09-14T08:00:00.000+05:30');
  const [isSaved, setIsSaved] = useState(false);

  // Database Connection State
  const [dbStatus, setDbStatus] = useState(null);
  const [dbUriInput, setDbUriInput] = useState('');
  const [isConnectingDb, setIsConnectingDb] = useState(false);
  const [dbMessage, setDbMessage] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.utsavName) setUtsavName(settings.utsavName);
      if (settings.targetAmount) setTargetAmount(settings.targetAmount);
      if (settings.upiId) setUpiId(settings.upiId);
      if (settings.location) setLocation(settings.location);
      if (settings.contactPhone) setContactPhone(settings.contactPhone);
      if (settings.startDate) setStartDate(settings.startDate);
    }
  }, [settings]);

  useEffect(() => {
    if (isAdmin && adminToken && isOpen) {
      loadDbStatus();
    }
  }, [isAdmin, adminToken, isOpen]);

  const loadDbStatus = async () => {
    try {
      const status = await api.getDbStatus(adminToken);
      setDbStatus(status);
    } catch (e) {
      console.error('Error loading DB status:', e);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const result = await login(pin);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Invalid Admin PIN');
    } else {
      setTimeout(() => loadDbStatus(), 200);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        utsavName: utsavName.trim(),
        targetAmount: Number(targetAmount),
        upiId: upiId.trim(),
        location: location.trim(),
        contactPhone: contactPhone.trim(),
        startDate: startDate
      }, adminToken);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
      if (onRefreshSettings) onRefreshSettings();
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const handleConnectDb = async (e) => {
    e.preventDefault();
    if (!dbUriInput.trim()) return;
    setIsConnectingDb(true);
    setDbMessage(null);
    try {
      const res = await api.connectDb(dbUriInput.trim(), adminToken);
      setDbStatus(res.status);
      setDbMessage({ type: 'success', text: 'Connected to MongoDB Cloud Database successfully! Data is now persistent.' });
      setDbUriInput('');
      if (onRefreshSettings) onRefreshSettings();
    } catch (err) {
      setDbMessage({ type: 'error', text: err.message || 'Failed to connect to MongoDB' });
    } finally {
      setIsConnectingDb(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const backup = await api.exportDbBackup(adminToken);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Vijaya_Colony_Ganesha_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Failed to export backup: ' + err.message);
    }
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsImporting(true);
        const json = JSON.parse(event.target.result);
        const res = await api.importDbBackup(json, adminToken);
        alert(`Backup restored successfully! (${res.donorsCount} Donors, ${res.messagesCount} Messages)`);
        loadDbStatus();
        if (onRefreshSettings) onRefreshSettings();
      } catch (err) {
        alert('Failed to import backup: ' + err.message);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className={`w-full ${activeTab === 'expenses' ? 'max-w-5xl' : 'max-w-lg'} transition-all duration-300 bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#120502] border-2 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col my-auto`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-crimson-900 via-saffron-800 to-crimson-900 p-3.5 sm:p-4 text-center relative border-b border-amber-500/30 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-amber-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 mx-auto flex items-center justify-center mb-1">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-devotional text-lg font-bold gold-gradient-text">
            కమిటీ అడ్మిన్ ప్యానెల్ | Committee Admin
          </h3>
          <p className="text-[11px] text-amber-200/80">
            Real-time management, cloud persistence & donation controls
          </p>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar flex-1 overscroll-contain">
          {!isAdmin ? (
            /* Admin PIN Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-amber-200/80">
                  Enter committee Secret PIN (default: <code className="text-amber-300 font-mono">ganesh2026</code>) to unlock admin mode and database settings.
                </p>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Admin PIN / Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter Secret Admin PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#170702] border border-amber-500/40 text-amber-100 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-600 text-amber-950 font-bold text-sm shadow-gold hover:brightness-110 active:scale-95 transition-all"
              >
                {isSubmitting ? 'Authenticating...' : 'Unlock Admin Mode 🔓'}
              </button>
            </form>
          ) : (
            /* Admin Active Hub */
            <div className="space-y-4">
              
              {/* Admin Status Strip & Exit */}
              <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-300">Admin Mode Active</h5>
                    <p className="text-[10px] text-emerald-400/80">Full editing, database persistence & ledger rights enabled</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-300 text-xs font-semibold shrink-0"
                >
                  Exit
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-3 gap-1.5 bg-[#170602] p-1 rounded-xl border border-amber-500/30">
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'settings'
                      ? 'bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 shadow-gold'
                      : 'text-amber-300/70 hover:text-amber-200'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="truncate">Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('expenses')}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'expenses'
                      ? 'bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 shadow-gold font-black'
                      : 'text-amber-300/70 hover:text-amber-200'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span className="truncate">Expenses 💰</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('database')}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'database'
                      ? 'bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 shadow-gold'
                      : 'text-amber-300/70 hover:text-amber-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span className="truncate">Database</span>
                </button>
              </div>

              {/* TAB 1: MANDAPAM SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-3 pt-1 text-xs">
                  <div>
                    <label className="block text-amber-300/80 mb-1">Utsav / Committee Name</label>
                    <input
                      type="text"
                      value={utsavName}
                      onChange={(e) => setUtsavName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-amber-300/80 mb-1">Target Amount (₹)</label>
                      <input
                        type="number"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-amber-300/80 mb-1">Mandapam UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-amber-300/80 mb-1">Mandapam Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-amber-300/80 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-amber-300/80 mb-1">
                      Festival Start Date & Time (ఉత్సవ ప్రారంభ తేదీ & సమయం)
                    </label>
                    <input
                      type="datetime-local"
                      value={startDate ? new Date(new Date(startDate).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '2026-09-14T08:00'}
                      onChange={(e) => setStartDate(new Date(e.target.value).toISOString())}
                      className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
                    />
                    <p className="text-[10px] text-amber-400/60 mt-0.5">
                      The Home Screen countdown timer dynamically counts down to this exact date & time in real-time.
                    </p>
                  </div>

                  {isSaved && (
                    <p className="text-emerald-400 text-xs font-semibold text-center">Settings saved successfully! ✅</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold hover:brightness-110 flex items-center justify-center gap-1.5 shadow-gold"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Mandapam Settings</span>
                  </button>

                  <div className="pt-2 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await requestNotificationPermission();
                        showDevotionalNotification({
                          title: '🔔 భక్తిశ్రద్ధల నోటిఫికేషన్ టెస్ట్ (Devotional Alert Test)',
                          body: 'విజయ కాలనీ గణేష్ ఉత్సవ లైవ్ అలర్ట్స్ మీ ఫోన్‌లో విజయవంతంగా పని చేస్తున్నాయి! 🙏',
                          tab: 'home'
                        });
                      }}
                      className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>నోటిఫికేషన్ టెస్ట్ (Test Alert)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('check-for-app-update', { detail: { force: true } }));
                      }}
                      className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>యాప్ అప్‌డేట్ (Check Update)</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: EXPENSES & PURSE MANAGER */}
              {activeTab === 'expenses' && (
                <div className="pt-1">
                  <ExpenseManager 
                    donors={donors} 
                    settings={settings} 
                    onRefresh={onRefreshSettings} 
                  />
                </div>
              )}

              {/* TAB 3: CLOUD DATABASE & BACKUP */}
              {activeTab === 'database' && (
                <div className="space-y-4 pt-1 text-xs">
                  
                  {/* Database Live Status Card */}
                  <div className={`p-4 rounded-2xl border ${
                    dbStatus?.connected 
                      ? 'bg-emerald-950/50 border-emerald-500/50' 
                      : 'bg-amber-950/40 border-amber-500/40'
                  } space-y-2`}>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className={`w-4 h-4 ${dbStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}`} />
                        <span className="font-bold text-sm text-white">
                          {dbStatus?.connected ? 'Cloud Database Connected 🟢' : 'Local Storage Mode (Ephemeral) 🟠'}
                        </span>
                      </div>
                      <button
                        onClick={loadDbStatus}
                        className="p-1 rounded-lg bg-black/40 text-amber-300 hover:text-white"
                        title="Refresh status"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {dbStatus?.connected ? (
                      <div className="space-y-1 text-emerald-200/90 text-[11px]">
                        <p>URI: <code className="text-emerald-300 font-mono">{dbStatus?.uriMasked}</code></p>
                        <p className="text-emerald-300 font-semibold">
                          ✨ All Donors, Live Auction Bids, and Youth Chat messages are permanently stored in MongoDB Atlas! Even if Render restarts 100 times, your data is 100% safe.
                        </p>
                        <div className="pt-1 flex gap-3 text-[10px] text-emerald-400/90">
                          <span>Donors: <strong>{dbStatus?.stats?.totalDonors}</strong></span>
                          <span>Bids: <strong>{dbStatus?.stats?.totalBids}</strong></span>
                          <span>Messages: <strong>{dbStatus?.stats?.totalMessages}</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-amber-200/80 text-[11px]">
                        <p className="text-amber-300">
                          ⚠️ Render free tier resets local files on restart. Connect to a free MongoDB Atlas database below to ensure all data is preserved permanently!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Connect to MongoDB Form */}
                  <form onSubmit={handleConnectDb} className="bg-[#180703] p-3.5 rounded-2xl border border-amber-500/30 space-y-2.5">
                    <h5 className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-amber-400" />
                      <span>{dbStatus?.connected ? 'Switch / Reconnect MongoDB URI' : 'Connect MongoDB Atlas (Permanent Storage)'}</span>
                    </h5>

                    <p className="text-[11px] text-amber-200/70">
                      Paste your MongoDB Connection String (e.g. from MongoDB Atlas free cluster):
                    </p>

                    <input
                      type="text"
                      required
                      placeholder="mongodb+srv://username:password@cluster0.mongodb.net/ganesha_utsav?retryWrites=true&w=majority"
                      value={dbUriInput}
                      onChange={(e) => setDbUriInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#100402] border border-amber-500/40 text-amber-100 text-xs font-mono focus:outline-none"
                    />

                    {dbMessage && (
                      <p className={`text-[11px] font-semibold ${dbMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {dbMessage.text}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isConnectingDb}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>{isConnectingDb ? 'Testing & Connecting...' : 'Connect Cloud Database 🚀'}</span>
                    </button>
                  </form>

                  {/* 1-Click Backup & Restore */}
                  <div className="bg-[#180703] p-3.5 rounded-2xl border border-amber-500/30 space-y-3">
                    <h5 className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>1-Click Full Data Backup & Restore</span>
                    </h5>
                    
                    <p className="text-[11px] text-amber-200/70">
                      You can also download a complete JSON backup of all Donors, Auction Bids, Messages, and Settings to your phone or computer anytime!
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="py-2.5 px-3 rounded-xl bg-[#280f07] hover:bg-[#38160a] border border-amber-500/40 text-amber-200 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>Download Backup (JSON)</span>
                      </button>

                      <label className="py-2.5 px-3 rounded-xl bg-[#280f07] hover:bg-[#38160a] border border-amber-500/40 text-amber-200 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isImporting ? 'Restoring...' : 'Restore Backup'}</span>
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleImportBackup}
                          disabled={isImporting}
                        />
                      </label>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
