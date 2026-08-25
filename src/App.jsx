import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { DonorsList } from './components/DonorsList';
import { LadduAuction } from './components/LadduAuction';
import { EventsTimeline } from './components/EventsTimeline';
import { YouthChat } from './components/YouthChat';
import { ExpenseManager } from './components/ExpenseManager';
import { DonationModal } from './components/DonationModal';
import { AdminModal } from './components/AdminModal';
import { MobileNav } from './components/MobileNav';
import { InstallAppBanner } from './components/InstallAppBanner';
import { AppSplashScreen } from './components/AppSplashScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { api } from './services/api';
import { playTempleBell } from './utils/audio';
import { X, MessageSquare } from 'lucide-react';

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const { isAdminModalOpen, setIsAdminModalOpen } = useAuth();
  const { socket } = useSocket();

  // Data States
  const [settings, setSettings] = useState(null);
  const [donors, setDonors] = useState([]);
  const [stats, setStats] = useState({ totalDonors: 0, totalAmount: 0, targetAmount: 70000 });
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [auction, setAuction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [chatToast, setChatToast] = useState(null);

  // Clear unread messages when switching to chat
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'chat') {
      setUnreadMessages(0);
      setChatToast(null);
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [settingsRes, donorsRes, eventsRes, messagesRes, auctionRes] = await Promise.all([
        api.getSettings().catch(() => ({})),
        api.getDonors().catch(() => ({ donors: [], stats: {} })),
        api.getEvents().catch(() => ([])),
        api.getMessages().catch(() => ([])),
        api.getAuction().catch(() => null)
      ]);

      setSettings(settingsRes);
      setDonors(donorsRes.donors || []);
      setStats(donorsRes.stats || { totalDonors: 0, totalAmount: 0, targetAmount: 70000 });
      setEvents(eventsRes || []);
      setMessages(messagesRes || []);
      setAuction(auctionRes);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time Socket.io Subscriptions
  useEffect(() => {
    if (!socket) return;

    socket.on('donor:created', (data) => {
      setDonors(prev => [data.newDonor, ...prev]);
      if (data.stats) setStats(data.stats);
    });

    socket.on('donor:updated', (data) => {
      setDonors(prev => prev.map(d => d.id === data.donor.id ? data.donor : d));
      if (data.stats) setStats(data.stats);
    });

    socket.on('donor:deleted', (data) => {
      setDonors(prev => prev.filter(d => d.id !== data.id));
      if (data.stats) setStats(data.stats);
    });

    socket.on('message:new', (msg) => {
      setMessages(prev => [...prev, msg]);
      
      // If user is currently not on the chat tab, notify them!
      setActiveTab(currentTab => {
        if (currentTab !== 'chat') {
          setUnreadMessages(prev => prev + 1);
          setChatToast(msg);
          setTimeout(() => setChatToast(null), 6000);
          playTempleBell();

          // Native browser push notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`💬 ${msg.senderName || 'Youth Member'}`, {
                body: msg.text || 'Shared an attachment/voice message',
                icon: '/colony_logo.jpg'
              });
            } catch (e) {}
          }
        }
        return currentTab;
      });
    });

    socket.on('message:reaction', ({ id, reactions }) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, reactions } : m));
    });

    socket.on('message:deleted', ({ id }) => {
      setMessages(prev => prev.filter(m => m.id !== id));
    });

    socket.on('event:updated', (updatedEvt) => {
      setEvents(prev => prev.map(e => e.id === updatedEvt.id ? updatedEvt : e));
    });

    socket.on('settings:updated', (updatedSet) => {
      setSettings(updatedSet);
    });

    socket.on('auction:updated', (updatedAuction) => {
      setAuction(updatedAuction);
    });

    socket.on('auction:newBid', ({ newBid, auction: updatedAuction }) => {
      setAuction(updatedAuction);
    });

    socket.on('auction:winnerDeclared', (updatedAuction) => {
      setAuction(updatedAuction);
    });

    return () => {
      socket.off('donor:created');
      socket.off('donor:updated');
      socket.off('donor:deleted');
      socket.off('message:new');
      socket.off('message:reaction');
      socket.off('message:deleted');
      socket.off('event:updated');
      socket.off('settings:updated');
      socket.off('auction:updated');
      socket.off('auction:newBid');
      socket.off('auction:winnerDeclared');
    };
  }, [socket]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#140602] via-[#200c06] to-[#100402] text-amber-50 selection:bg-amber-500 selection:text-amber-950 pb-20 md:pb-10">
      
      {/* App Opening Screen with Transparent PNG Logo */}
      <AppSplashScreen isReady={!isLoading} />

      {/* Top Devotional Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenDonation={() => setIsDonationOpen(true)}
        settings={settings}
        unreadMessages={unreadMessages}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div className="space-y-4">
            <HeroSection
              stats={stats}
              settings={settings}
              auction={auction}
              onOpenDonation={() => setIsDonationOpen(true)}
              setActiveTab={setActiveTab}
            />

            {/* Quick Preview Sections */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-8">
              
              {/* 4-Day Events Preview Teaser */}
              <div className="temple-card p-6 rounded-3xl border border-amber-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-devotional text-lg sm:text-xl font-bold gold-gradient-text">
                    4-Day Celebrations Overview (ఉత్సవ వివరాలు)
                  </h3>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="text-xs text-amber-400 hover:text-amber-200 font-semibold underline"
                  >
                    View All Details →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {events.map((evt) => (
                    <div 
                      key={evt.id}
                      onClick={() => setActiveTab('events')}
                      className="bg-[#1c0803] p-4 rounded-2xl border border-amber-500/20 hover:border-amber-400/60 cursor-pointer transition-all space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded-full">Day {evt.dayNumber}</span>
                        <span className="text-amber-300/70 text-[11px]">{evt.time}</span>
                      </div>
                      <h4 className="font-bold text-sm text-amber-100 line-clamp-1">{evt.title}</h4>
                      <p className="text-xs text-amber-200/70 line-clamp-2">{evt.description}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'donors' && (
          <DonorsList
            donors={donors}
            stats={stats}
            settings={settings}
            onOpenDonation={() => setIsDonationOpen(true)}
            onRefreshDonors={fetchData}
          />
        )}

        {activeTab === 'auction' && (
          <LadduAuction
            onOpenDonation={() => setIsDonationOpen(true)}
          />
        )}

        {activeTab === 'expenses' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ExpenseManager
              donors={donors}
              settings={settings}
              onRefresh={fetchData}
            />
          </div>
        )}

        {activeTab === 'events' && (
          <EventsTimeline
            events={events}
            settings={settings}
            onRefreshEvents={fetchData}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'chat' && (
          <YouthChat
            messages={messages}
            onRefreshMessages={fetchData}
          />
        )}
      </main>

      {/* Devotional Footer */}
      <footer className="mt-auto border-t border-amber-500/20 bg-[#120401] py-8 px-4 text-center text-xs text-amber-300/70 space-y-3">
        <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm sm:text-base">
          <span>🕉️</span>
          <span>{settings?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్'}</span>
          <span>🕉️</span>
        </div>
        
        <p className="max-w-xl mx-auto text-amber-200/70 italic text-[11px] sm:text-xs">
          "సర్వ మంగళ మాంగళ్యే శివే సర్వార్థ సాధికే | శరణ్యే త్ర్యంబకే గౌరీ నారాయణి నమోస్తుతే ||"
        </p>

        {/* Instagram Link Strip */}
        <div className="pt-1 flex items-center justify-center gap-2">
          <a
            href="https://instagram.com/vijayacolony_ganesha_diaries"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-950/70 via-[#2a091d] to-purple-950/70 border border-pink-500/40 text-pink-300 hover:text-white text-xs font-semibold shadow-sm transition-all"
          >
            <span>📸</span>
            <span>Follow @vijayacolony_ganesha_diaries on Instagram</span>
          </a>
        </div>

        {/* Admin Panel Quick Trigger */}
        <div className="pt-2">
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-[11px] text-amber-400/80 hover:text-amber-200 bg-[#1e0a04] px-3 py-1 rounded-full border border-amber-500/20 hover:border-amber-500/50 transition-all"
          >
            <span>⚙️</span>
            <span>Committee Admin & Cloud Database Panel</span>
          </button>
        </div>

        <p className="text-[11px] text-amber-500/50 pt-1">
          Vijaya Colony Ganesha Diaries 2026 • Live Donations, Laddu Auction & Community Platform
        </p>
      </footer>

      {/* Donation Modal */}
      <DonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        settings={settings}
        onDonationSuccess={() => fetchData()}
      />

      {/* Admin PIN & Configuration Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        settings={settings}
        donors={donors}
        onRefreshSettings={fetchData}
      />

      {/* Floating Chat Message Toast Banner */}
      {chatToast && activeTab !== 'chat' && (
        <div 
          onClick={() => handleTabChange('chat')}
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-[#250c05] border-2 border-amber-400 p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform animate-bounce max-w-xs sm:max-w-sm"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400 flex items-center justify-center text-lg shrink-0">
            💬
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">New Youth Chat Message</span>
            <strong className="text-xs text-amber-100 block truncate">{chatToast.senderName || 'Youth Member'}</strong>
            <p className="text-[11px] text-amber-200/80 truncate">{chatToast.text || 'Sent an attachment / voice'}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setChatToast(null);
            }}
            className="p-1 text-amber-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1-Tap Mobile App Install Banner */}
      <InstallAppBanner />

      {/* Mobile App Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenDonation={() => setIsDonationOpen(true)}
        unreadMessages={unreadMessages}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
