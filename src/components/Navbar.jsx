import React, { useState } from 'react';
import { Sparkles, Heart, Bell, Shield, Lock, Trophy, Calendar, MessageSquare, Instagram } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playTempleBell } from '../utils/audio';

export const Navbar = ({ activeTab, setActiveTab, onOpenDonation, settings, unreadMessages = 0 }) => {
  const { isAdmin, setIsAdminModalOpen, logout } = useAuth();
  const [bellRinging, setBellRinging] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles, telugu: 'ప్రారంభం' },
    { id: 'donors', label: 'Donors', icon: Heart, telugu: 'విరాళాలు' },
    { id: 'auction', label: 'Laddu Auction 🏆', icon: Trophy, telugu: 'లడ్డూ వేలం' },
    { id: 'events', label: 'Events', icon: Calendar, telugu: 'కార్యక్రమాలు' },
    { id: 'chat', label: 'Youth Chat', icon: MessageSquare, telugu: 'యువజన చర్చ', badge: unreadMessages }
  ];

  const handleBellClick = () => {
    setBellRinging(true);
    playTempleBell();
    setTimeout(() => setBellRinging(false), 800);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#160602]/95 backdrop-blur-md border-b border-amber-500/30 shadow-2xl transition-all">
      {/* Top Auspicious Gold Border Bar */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"></div>
      
      {/* Sub-header Announcement Bar */}
      <div className="bg-gradient-to-r from-[#24081c] via-[#240e06] to-[#24081c] py-1 px-3 text-center text-[10px] sm:text-xs text-amber-200 border-b border-amber-500/20 flex items-center justify-between sm:justify-center gap-2 overflow-hidden whitespace-nowrap">
        <span className="font-semibold shrink-0">🚩 గణపతి బప్పా మోరియా</span>
        <span className="text-amber-500/40 hidden sm:inline">•</span>
        <a 
          href="https://instagram.com/vijayacolony_ganesha_diaries" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-pink-400 hover:text-pink-300 font-bold inline-flex items-center gap-1 underline truncate text-[10px] sm:text-xs"
        >
          <Instagram className="w-3 h-3 shrink-0" />
          <span className="truncate">@vijayacolony_ganesha_diaries</span>
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-2">
          
          {/* Logo & Brand (Cleanly aligned and non-overflowing on mobile) */}
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0 flex-1"
            onClick={() => setActiveTab('home')}
          >
            <div className="relative w-9 h-9 sm:w-12 sm:h-12 shrink-0 rounded-full bg-gradient-to-br from-amber-400 via-saffron-500 to-crimson-700 p-[2px] shadow-gold group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full bg-[#1b0803] flex items-center justify-center overflow-hidden p-0.5">
                <img 
                  src="/colony_logo.png" 
                  alt="Vijaya Colony Ganesha Diaries" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-400 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] text-amber-950 font-bold">
                ॐ
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-devotional text-[13px] sm:text-lg font-extrabold tracking-tight sm:tracking-wide gold-gradient-text leading-tight group-hover:brightness-110 truncate">
                {settings?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్'}
              </h1>
              <p className="text-[9px] sm:text-xs text-amber-300/80 font-medium tracking-tight sm:tracking-wider truncate">
                Vijaya Colony Ganesha Diaries
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-saffron-600 to-amber-600 text-white shadow-gold border border-amber-300/30 scale-105'
                      : 'text-amber-200/80 hover:text-amber-100 hover:bg-amber-950/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-200 animate-bounce' : 'text-amber-400'}`} />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Instagram Quick Link Button (Desktop & Tablet) */}
            <a
              href="https://instagram.com/vijayacolony_ganesha_diaries"
              target="_blank"
              rel="noopener noreferrer"
              title="Official Instagram Page: @vijayacolony_ganesha_diaries"
              className="hidden sm:flex p-2 rounded-xl bg-gradient-to-br from-pink-950/80 via-[#2e0921] to-purple-950/80 border border-pink-500/40 text-pink-300 hover:text-white hover:border-pink-400 transition-all items-center gap-1 shadow-sm group"
            >
              <Instagram className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline text-xs font-semibold">@vijayacolony_ganesha_diaries</span>
            </a>

            {/* Temple Bell Audio Chime */}
            <button
              onClick={handleBellClick}
              title="Ring Temple Bell (దేవాలయ ఘంటానాదం)"
              aria-label="Ring Temple Bell"
              className={`p-1.5 sm:p-2.5 rounded-full bg-gradient-to-br from-amber-900/60 to-saffron-950/80 border border-amber-500/40 text-amber-300 hover:text-amber-100 hover:border-amber-400 transition-all shrink-0 ${
                bellRinging ? 'scale-125 rotate-12 text-yellow-300 shadow-gold' : ''
              }`}
            >
              <Bell className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 ${bellRinging ? 'animate-wiggle' : ''}`} />
            </button>

            {/* Donate Quick CTA */}
            <button
              onClick={onOpenDonation}
              className="relative group overflow-hidden px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-500 text-amber-950 shadow-divine hover:brightness-110 active:scale-95 transition-all duration-200 flex items-center gap-1 shrink-0"
            >
              <Heart className="w-3.5 h-3.5 text-crimson-800 fill-crimson-800 animate-pulse" />
              <span className="font-bold">Donate</span>
            </button>

            {/* Admin Login / Status */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(true)}
                  className="flex items-center gap-1 text-emerald-300 hover:text-white transition-colors"
                  title="Open Admin & Database Panel"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] sm:text-xs font-bold">Admin</span>
                </button>
                <span className="text-emerald-500/40">•</span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-[10px] text-amber-300/80 hover:text-red-300 underline"
                  title="Logout Admin"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className="p-1.5 sm:p-2 rounded-xl bg-[#2b1008] border border-amber-500/30 text-amber-300/80 hover:text-amber-100 hover:border-amber-400 transition-all text-xs flex items-center gap-1 shrink-0"
                title="Committee Admin Login & Database Settings"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px] font-semibold text-amber-300">Admin</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
