import React, { useState } from 'react';
import { X, Shield, Lock, KeyRound, Settings, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const AdminModal = ({ isOpen, onClose, settings, onRefreshSettings }) => {
  const { isAdmin, adminToken, login, logout } = useAuth();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Settings Form
  const [utsavName, setUtsavName] = useState(settings?.utsavName || '');
  const [targetAmount, setTargetAmount] = useState(settings?.targetAmount || 250000);
  const [upiId, setUpiId] = useState(settings?.upiId || 'ganeshutsav@upi');
  const [location, setLocation] = useState(settings?.location || '');
  const [contactPhone, setContactPhone] = useState(settings?.contactPhone || '');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const result = await login(pin);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Invalid Admin PIN');
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
        contactPhone: contactPhone.trim()
      }, adminToken);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
      if (onRefreshSettings) onRefreshSettings();
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#120502] border-2 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col my-auto">
        
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
            కమిటీ అడ్మిన్ లాగిన్ | Committee Admin
          </h3>
          <p className="text-[11px] text-amber-200/80">
            Secure panel to manage donations, edit records & configure settings
          </p>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar flex-1 overscroll-contain">
          {!isAdmin ? (
            /* Admin PIN Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-amber-200/80">
                  Enter committee Secret PIN to unlock editing & deletion rights on the Donors list.
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
            /* Admin Active Hub & Settings Configuration */
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-300">Admin Mode Active</h5>
                    <p className="text-[10px] text-emerald-400/80">You can now Edit & Delete donor ledger records</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-300 text-xs font-semibold"
                >
                  Exit Admin
                </button>
              </div>

              {/* Committee Configuration Form */}
              <form onSubmit={handleSaveSettings} className="space-y-3 pt-2 text-xs">
                <h4 className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Mandapam Settings</span>
                </h4>

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

                {isSaved && (
                  <p className="text-emerald-400 text-xs font-semibold text-center">Settings saved successfully! ✅</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold hover:brightness-110 flex items-center justify-center gap-1.5 shadow-gold"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Settings</span>
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
