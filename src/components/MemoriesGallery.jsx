import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Image as ImageIcon, Film, Upload, Search, Heart, Share2, Download, Eye, Pin, Plus, Filter, Play, Calendar, User, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UploadMemoryModal } from './UploadMemoryModal';
import { MemoryLightboxModal } from './MemoryLightboxModal';
import { playTempleBell } from '../utils/audio';

const CATEGORIES = [
  { id: 'all', label: 'అన్నీ (All)', icon: '🌟' },
  { id: 'alankaram', label: 'స్వామి అలంకరణ', icon: '🪔' },
  { id: 'pooja', label: 'పూజలు & హారతులు', icon: '🌺' },
  { id: 'annadanam', label: 'మహా అన్నదానం', icon: '🍲' },
  { id: 'auction', label: 'లడ్డు వేలంపాట', icon: '🏆' },
  { id: 'shobhayatra', label: 'శోభాయాత్ర', icon: '🚩' },
  { id: 'youth', label: 'యూత్ ఫోటోలు', icon: '✨' },
  { id: 'general', label: 'ఇతర జ్ఞాపకాలు', icon: '📸' }
];

const EMOJIS = ['🌺', '🙏', '🪔', '🕉️', '❤️', '🎉', '🌟'];

export const MemoriesGallery = ({ settings, initialMemories = [] }) => {
  const { isAdmin } = useAuth();
  const [memories, setMemories] = useState(initialMemories);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMediaType, setSelectedMediaType] = useState('all'); // 'all' | 'image' | 'video'
  const [selectedDay, setSelectedDay] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeLightboxMemory, setActiveLightboxMemory] = useState(null);
  const [pinnedIndex, setPinnedIndex] = useState(0);

  const uploaderId = typeof window !== 'undefined' ? localStorage.getItem('ganesh_uploader_id') : '';

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMemories();
      if (Array.isArray(data)) {
        setMemories(data);
      }
    } catch (err) {
      console.warn('Failed to fetch memories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();

    // Listen to Socket.IO real-time memory broadcasts
    const handleNewMemory = (newMem) => {
      setMemories(prev => {
        if (prev.some(m => m.id === newMem.id)) return prev;
        return [newMem, ...prev];
      });
    };

    const handleUpdatedMemory = (updatedMem) => {
      setMemories(prev => prev.map(m => m.id === updatedMem.id ? updatedMem : m));
    };

    const handleDeleteMemory = (id) => {
      setMemories(prev => prev.filter(m => m.id !== id));
    };

    const handleReaction = ({ id, reactions, reactedUsers }) => {
      setMemories(prev => prev.map(m => {
        if (m.id === id) {
          return { ...m, reactions, reactedUsers };
        }
        return m;
      }));
    };

    window.addEventListener('socket-memory-new', (e) => handleNewMemory(e.detail));
    window.addEventListener('socket-memory-updated', (e) => handleUpdatedMemory(e.detail));
    window.addEventListener('socket-memory-deleted', (e) => handleDeleteMemory(e.detail));
    window.addEventListener('socket-memory-reaction', (e) => handleReaction(e.detail));

    return () => {
      window.removeEventListener('socket-memory-new', (e) => handleNewMemory(e.detail));
      window.removeEventListener('socket-memory-updated', (e) => handleUpdatedMemory(e.detail));
      window.removeEventListener('socket-memory-deleted', (e) => handleDeleteMemory(e.detail));
      window.removeEventListener('socket-memory-reaction', (e) => handleReaction(e.detail));
    };
  }, []);

  // Filtered Memories
  const filteredMemories = useMemo(() => {
    return memories.filter(m => {
      if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
      if (selectedMediaType !== 'all') {
        if (selectedMediaType === 'video' && m.mediaType !== 'video' && m.mediaType !== 'youtube') return false;
        if (selectedMediaType === 'image' && m.mediaType !== 'image') return false;
      }
      if (selectedDay !== 'all' && m.day !== selectedDay) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (m.title || '').toLowerCase().includes(query);
        const matchesDesc = (m.description || '').toLowerCase().includes(query);
        const matchesUploader = (m.uploaderName || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesUploader) return false;
      }
      return true;
    });
  }, [memories, selectedCategory, selectedMediaType, selectedDay, searchQuery]);

  // Spotlight Pinned Memories
  const pinnedMemories = useMemo(() => {
    return memories.filter(m => m.isPinned);
  }, [memories]);

  // Rotate Spotlight banner automatically
  useEffect(() => {
    if (pinnedMemories.length <= 1) return;
    const interval = setInterval(() => {
      setPinnedIndex(prev => (prev + 1) % pinnedMemories.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [pinnedMemories.length]);

  const handleReact = async (id, emoji, userId) => {
    try {
      const res = await api.reactToMemory(id, emoji, userId);
      setMemories(prev => prev.map(m => {
        if (m.id === id) {
          return { ...m, reactions: res.reactions, reactedUsers: res.reactedUsers };
        }
        return m;
      }));
    } catch (e) {
      console.warn('Failed to record reaction:', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = isAdmin ? 'ganesh2026-admin-session-token' : null;
      await api.deleteMemory(id, token, uploaderId);
      setMemories(prev => prev.filter(m => m.id !== id));
      playTempleBell();
    } catch (e) {
      alert(e.message || 'Failed to delete memory');
    }
  };

  const handlePinToggle = async (id, isPinned) => {
    try {
      const token = 'ganesh2026-admin-session-token';
      const updated = await api.updateMemory(id, { isPinned }, token);
      setMemories(prev => prev.map(m => m.id === id ? updated.memory || updated : m));
    } catch (e) {
      alert('Failed to update pin status');
    }
  };

  // Metrics
  const totalPhotos = memories.filter(m => m.mediaType === 'image').length;
  const totalVideos = memories.filter(m => m.mediaType === 'video' || m.mediaType === 'youtube').length;
  const totalBlessings = memories.reduce((acc, m) => {
    const rx = m.reactions || {};
    return acc + Object.values(rx).reduce((a, b) => a + Number(b || 0), 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      
      {/* Top Auspicious Spotlight Carousel (If any memory is pinned) */}
      {pinnedMemories.length > 0 && (
        <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-gradient-to-r from-[#2a0e05] via-[#1c0803] to-[#2a0e05]">
          <div className="relative aspect-[16/8] sm:aspect-[21/9] max-h-[360px] w-full overflow-hidden flex items-center justify-center">
            
            {pinnedMemories[pinnedIndex]?.mediaType === 'video' ? (
              <video
                src={pinnedMemories[pinnedIndex]?.mediaUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover brightness-90 cursor-pointer"
                onClick={() => setActiveLightboxMemory(pinnedMemories[pinnedIndex])}
              ></video>
            ) : (
              <img
                src={pinnedMemories[pinnedIndex]?.mediaUrl}
                alt={pinnedMemories[pinnedIndex]?.title}
                className="w-full h-full object-cover brightness-90 cursor-pointer hover:scale-105 transition-transform duration-700"
                onClick={() => setActiveLightboxMemory(pinnedMemories[pinnedIndex])}
              />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-between p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/30 backdrop-blur-md border border-amber-400 text-amber-200 text-xs font-extrabold shadow-lg">
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>విశేష ఉత్సవ జ్ఞాపకం (Featured Spotlight)</span>
                </span>

                <span className="px-2.5 py-0.5 rounded-full bg-black/60 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                  {pinnedIndex + 1} / {pinnedMemories.length}
                </span>
              </div>

              <div className="space-y-1.5 max-w-2xl cursor-pointer" onClick={() => setActiveLightboxMemory(pinnedMemories[pinnedIndex])}>
                <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                  <span className="bg-crimson-900/90 px-2 py-0.5 rounded-md border border-amber-500/30">
                    {pinnedMemories[pinnedIndex]?.day}
                  </span>
                  <span>• {pinnedMemories[pinnedIndex]?.uploaderName}</span>
                </div>
                <h3 className="font-devotional text-lg sm:text-2xl font-bold gold-gradient-text leading-tight drop-shadow-md">
                  {pinnedMemories[pinnedIndex]?.title}
                </h3>
                {pinnedMemories[pinnedIndex]?.description && (
                  <p className="text-xs sm:text-sm text-amber-100/90 line-clamp-2 leading-relaxed">
                    {pinnedMemories[pinnedIndex]?.description}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Dots Indicator */}
          {pinnedMemories.length > 1 && (
            <div className="absolute bottom-2 right-4 flex items-center gap-1.5 z-10">
              {pinnedMemories.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPinnedIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === pinnedIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-amber-500/40'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header Banner & Stats Overview Bar */}
      <div className="bg-gradient-to-r from-[#200903] via-[#1a0702] to-[#200903] border-2 border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 mb-1.5">
              <span>🌺 శ్రీ గణపతి ఉత్సవ మధుర స్మృతులు 🌺</span>
            </div>
            <h2 className="font-devotional text-xl sm:text-3xl font-extrabold gold-gradient-text">
              ఉత్సవ జ్ఞాపకాల గ్యాలరీ (Memories Gallery)
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
              4 రోజుల ఉత్సవ విశేషాలు, దివ్య హారతులు, అన్నదానం, లడ్డూ వేలంపాట & శోభాయాత్ర అపురూప దృశ్యాలు (Ultra-HD 1GB)
            </p>
          </div>

          {/* Upload CTA Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-saffron-500 to-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-gold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 border border-amber-300/40"
          >
            <Upload className="w-4 h-4" />
            <span>జ్ఞాపకం అప్‌లోడ్ చేయండి (+ Add Memory)</span>
          </button>
        </div>

        {/* Quick Counters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-amber-500/20">
          <div className="p-2.5 rounded-2xl bg-[#140502] border border-amber-500/20 text-center">
            <span className="text-[10px] text-amber-400 font-semibold block">మొత్తం జ్ఞాపకాలు</span>
            <span className="text-base sm:text-lg font-bold text-amber-100 font-mono">{memories.length}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#140502] border border-amber-500/20 text-center">
            <span className="text-[10px] text-emerald-400 font-semibold block">📷 ఫోటోలు</span>
            <span className="text-base sm:text-lg font-bold text-emerald-300 font-mono">{totalPhotos}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#140502] border border-amber-500/20 text-center">
            <span className="text-[10px] text-yellow-400 font-semibold block">🎬 వీడియోలు</span>
            <span className="text-base sm:text-lg font-bold text-yellow-300 font-mono">{totalVideos}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#140502] border border-amber-500/20 text-center">
            <span className="text-[10px] text-rose-400 font-semibold block">🌺 భక్తిపూర్వక హారతులు</span>
            <span className="text-base sm:text-lg font-bold text-rose-300 font-mono">{totalBlessings}</span>
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3">
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-gold border border-amber-300/40 scale-105'
                  : 'bg-[#1e0a04] text-amber-300/70 hover:text-amber-100 border border-amber-500/20'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Media Type & Search Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          
          {/* Media Type Switcher */}
          <div className="flex bg-[#180702] p-1 rounded-2xl border border-amber-500/30 text-xs w-full sm:w-auto">
            <button
              onClick={() => setSelectedMediaType('all')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                selectedMediaType === 'all'
                  ? 'bg-amber-500 text-amber-950 shadow-sm'
                  : 'text-amber-300/70 hover:text-amber-100'
              }`}
            >
              అన్నీ (All)
            </button>
            <button
              onClick={() => setSelectedMediaType('image')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                selectedMediaType === 'image'
                  ? 'bg-amber-500 text-amber-950 shadow-sm'
                  : 'text-amber-300/70 hover:text-amber-100'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>ఫోటోలు</span>
            </button>
            <button
              onClick={() => setSelectedMediaType('video')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                selectedMediaType === 'video'
                  ? 'bg-amber-500 text-amber-950 shadow-sm'
                  : 'text-amber-300/70 hover:text-amber-100'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>వీడియోలు</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-amber-400/60" />
            <input
              type="text"
              placeholder="జ్ఞాపకం లేదా భక్తుడి పేరు వెతకండి..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#180702] border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400 placeholder:text-amber-400/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-amber-400/60 hover:text-amber-200"
              >
                ✕
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Main Masonry / Responsive Grid */}
      {filteredMemories.length === 0 ? (
        <div className="p-12 text-center bg-[#180702] border border-amber-500/30 rounded-3xl space-y-3">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-3xl">
            📷
          </div>
          <h4 className="text-amber-200 font-bold text-base">జ్ఞాపకాలు ఏవీ కనుగొనబడలేదు</h4>
          <p className="text-xs text-amber-400/70 max-w-sm mx-auto">
            ఈ విభాగంలో ఇంకా ఫోటోలు లేదా వీడియోలు లేవు. మొదటి జ్ఞాపకాన్ని అప్‌లోడ్ చేయండి!
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs shadow-md"
          >
            + ఫోటో అప్‌లోడ్ చేయండి
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredMemories.map((item) => {
            const isVideo = item.mediaType === 'video' || item.mediaType === 'youtube';
            const userReactions = item.reactedUsers?.[uploaderId] || [];

            return (
              <div
                key={item.id}
                className="group temple-card rounded-3xl overflow-hidden border border-amber-500/30 hover:border-amber-400/70 transition-all duration-300 flex flex-col bg-[#1c0803] hover:shadow-gold"
              >
                {/* Media Thumbnail Box */}
                <div
                  className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-black cursor-pointer"
                  onClick={() => setActiveLightboxMemory(item)}
                >
                  <img
                    src={item.thumbnailUrl || item.mediaUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Video Play Badge */}
                  {isVideo && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-amber-500/90 text-amber-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-amber-950 translate-x-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Badges Top Bar */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-200 text-[10px] font-bold">
                      {item.day}
                    </span>

                    {item.isPinned && (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-yellow-950 text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                        <Pin className="w-3 h-3" />
                        <span>Spotlight</span>
                      </span>
                    )}
                  </div>

                  {/* View counter overlay */}
                  {item.viewsCount > 0 && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-amber-300 text-[10px] font-mono flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{item.viewsCount}</span>
                    </div>
                  )}
                </div>

                {/* Card Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  
                  <div className="space-y-1.5">
                    <h4 
                      onClick={() => setActiveLightboxMemory(item)}
                      className="font-devotional text-base font-bold text-amber-100 hover:text-amber-300 cursor-pointer line-clamp-1 leading-tight"
                    >
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="text-xs text-amber-200/70 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Uploader & Date */}
                  <div className="flex items-center justify-between text-[11px] text-amber-300/70 pt-1 border-t border-amber-500/20">
                    <span className="font-semibold text-amber-200 flex items-center gap-1">
                      <User className="w-3 h-3 text-amber-400" />
                      <span className="truncate max-w-[130px]">{item.uploaderName}</span>
                    </span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('te-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Devotional Reactions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
                      {EMOJIS.slice(0, 4).map((emoji) => {
                        const count = item.reactions?.[emoji] || 0;
                        const hasReacted = userReactions.includes(emoji);

                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReact(item.id, emoji, uploaderId)}
                            className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-all active:scale-125 ${
                              hasReacted
                                ? 'bg-amber-500/30 border border-amber-400 text-amber-100 font-bold'
                                : 'bg-[#140502] hover:bg-amber-950 text-amber-300/70 border border-amber-500/15'
                            }`}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span className="font-mono text-[10px]">{count}</span>}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setActiveLightboxMemory(item)}
                      className="text-xs text-amber-400 font-bold hover:text-amber-200 flex items-center gap-1 shrink-0"
                    >
                      <span>చూడండి →</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <MemoryLightboxModal
        memory={activeLightboxMemory}
        memories={filteredMemories}
        isOpen={Boolean(activeLightboxMemory)}
        onClose={() => setActiveLightboxMemory(null)}
        onNavigate={(mem) => setActiveLightboxMemory(mem)}
        onReact={handleReact}
        onDelete={handleDelete}
        onPinToggle={handlePinToggle}
        settings={settings}
      />

      {/* Upload Memory Modal */}
      <UploadMemoryModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(newMem) => {
          setMemories(prev => [newMem, ...prev]);
        }}
        settings={settings}
      />

    </div>
  );
};
