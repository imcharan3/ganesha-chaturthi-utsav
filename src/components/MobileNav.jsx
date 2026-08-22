import React from 'react';
import { Flame, Heart, Calendar, MessageSquare, PlusCircle } from 'lucide-react';

export const MobileNav = ({ activeTab, setActiveTab, onOpenDonation, unreadMessages = 0 }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Flame },
    { id: 'donors', label: 'Donors', icon: Heart },
    { id: 'donate_action', label: 'Donate', icon: PlusCircle, isAction: true },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'chat', label: 'Chat', icon: MessageSquare, badge: unreadMessages }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#170602]/95 backdrop-blur-lg border-t border-amber-500/30 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-5px_20px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={onOpenDonation}
                className="flex flex-col items-center justify-center -translate-y-3 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-saffron-500 to-yellow-400 text-amber-950 flex items-center justify-center shadow-divine border-2 border-[#170602] group-active:scale-95 transition-transform">
                  <Heart className="w-6 h-6 fill-crimson-900 text-crimson-900 animate-pulse" />
                </div>
                <span className="text-[10px] font-extrabold text-amber-300 mt-0.5">Donate</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive ? 'text-amber-300 font-bold scale-105' : 'text-amber-400/60 hover:text-amber-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400 animate-bounce' : ''}`} />
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-amber-400 mt-0.5"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
