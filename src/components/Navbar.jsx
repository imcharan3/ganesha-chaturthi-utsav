import React, { useState } from 'react';
import { Sparkles, Heart, Bell, Shield, Lock, Trophy, Calendar, MessageSquare, Instagram } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playTempleBell } from '../utils/audio';

export const Navbar = ({ activeTab, setActiveTab, onOpenDonation, settings }) => {
  const { isAdmin, setIsAdminModalOpen, logout } = useAuth();
  const [bellRinging, setBellRinging] = useState(false);

  const handleBellClick = () => {
    setBellRinging(true);
    playTempleBell();
    setTimeout(() => setBellRinging(false), 800);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles, telugu: 'ప్రారంభం' },
    { id: 'donors', label: 'Donors', icon: Heart, telugu: 'విరాళాలు' },
    { id: 'auction', label: 'Laddu Auction 🏆', icon: Trophy, telugu: 'లడ్డూ వేలం' },
    { id: 'events', label: 'Events', icon: Calendar, telugu: 'కార్యక్రమాలు' },
    { id: 'chat', label: 'Youth Chat', icon: MessageSquare, telugu: 'యువజన చర్చ' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#160602]/95 backdrop-blur-md border-b border-amber-500/30 shadow-2xl transition-all">
      {/* Top Auspicious Gold Border Bar */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"></div>
      
      {/* Sub-header Announcement Bar */}
      <div className="bg-gradient-to-r from-[#24081c] via-[#240e06] to-[#24081c] py-1 px-4 text-center text-[11px] sm:text-xs text-amber-200 border-b border-amber-500/20 flex items-center justify-center gap-2">
        <span>🚩 గణపతి బప్పా మోరియా 🚩</span>
        <span className="text-amber-500/40 hidden sm:inline">•</span>
        <a 
          href="https://instagram.com/vijayacolony_ganesha_diaries" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 underline"
        >
          <Instagram className="w-3.5 h-3.5" />
          <span>Follow @vijayacolony_ganesha_diaries for Daily Updates & Live Photos</span>
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
          >
            <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-amber-400 via-saffron-500 to-crimson-700 p-[2px] shadow-gold group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full bg-[#122818] flex items-center justify-center overflow-hidden">
                <img 
                  src="/colony_logo.jpg" 
                  alt="Vijaya Colony Ganesha Diaries" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-amber-950 font-bold">
                ॐ
              </div>
            </div>

            <div>
              <h1 className="font-devotional text-base sm:text-lg font-bold tracking-wide gold-gradient-text leading-tight group-hover:brightness-110">
                {settings?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్'}
              </h1>
              <p className="text-[10px] sm:text-xs text-amber-300/80 font-medium tracking-wider">
                Vijaya Colony Ganesha Diaries • 2026
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
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Instagram Quick Link Button */}
            <a
              href="https://instagram.com/vijayacolony_ganesha_diaries"
              target="_blank"
              rel="noopener noreferrer"
              title="Official Instagram Page: @vijayacolony_ganesha_diaries"
              className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-pink-950/80 via-[#2e0921] to-purple-950/80 border border-pink-500/40 text-pink-300 hover:text-white hover:border-pink-400 transition-all flex items-center gap-1 shadow-sm group"
            >
              <Instagram className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline text-xs font-semibold">@vijayacolony_ganesha_diaries</span>
            </a>

            {/* Temple Bell Audio Chime */}
            <button
              onClick={handleBellClick}
              title="Ring Temple Bell (దేవాలయ ఘంటానాదం)"
              aria-label="Ring Temple Bell"
              className={`p-2 sm:p-2.5 rounded-full bg-gradient-to-br from-amber-900/60 to-saffron-950/80 border border-amber-500/40 text-amber-300 hover:text-amber-100 hover:border-amber-400 transition-all ${
                bellRinging ? 'scale-125 rotate-12 text-yellow-300 shadow-gold' : ''
              }`}
            >
              <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${bellRinging ? 'animate-wiggle' : ''}`} />
            </button>

            {/* Donate Quick CTA */}
            <button
              onClick={onOpenDonation}
              className="relative group overflow-hidden px-3.5 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-500 text-amber-950 shadow-divine hover:brightness-110 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
            >
              <span className="relative z-10 flex items-center gap-1.5 font-bold">
                <Heart className="w-4 h-4 text-crimson-800 fill-crimson-800 animate-pulse" />
                <span className="hidden sm:inline">Donate Now</span>
                <span className="sm:hidden">Donate</span>
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>

            {/* Admin Login / Status */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1.5 rounded-xl">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="hidden lg:inline text-xs font-semibold text-emerald-300">Admin Active</span>
                <button
                  onClick={logout}
                  className="text-[11px] text-amber-300 hover:text-red-300 ml-1 underline"
                  title="Logout Admin"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="p-2 sm:p-2.5 rounded-xl bg-[#2b1008] border border-amber-500/30 text-amber-300/80 hover:text-amber-100 hover:border-amber-400 transition-all text-xs flex items-center gap-1"
                title="Committee Admin Login"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="hidden xl:inline font-medium">Admin</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
