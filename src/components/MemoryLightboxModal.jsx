import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Share2, Download, Heart, Eye, Sparkles, Pin, Trash2, Shield, Calendar, User, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { playTempleBell } from '../utils/audio';

const EMOJIS = ['🌺', '🙏', '🪔', '🕉️', '❤️', '🎉', '🌟'];

export const MemoryLightboxModal = ({
  memory,
  memories = [],
  isOpen,
  onClose,
  onNavigate,
  onReact,
  onDelete,
  onPinToggle,
  settings
}) => {
  const { isAdmin } = useAuth();
  const [currentMemory, setCurrentMemory] = useState(memory);
  const [activeReactionAnim, setActiveReactionAnim] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const uploaderId = typeof window !== 'undefined' ? localStorage.getItem('ganesh_uploader_id') : '';
  const isOwner = currentMemory && (isAdmin || (uploaderId && currentMemory.uploaderId === uploaderId));

  useEffect(() => {
    setCurrentMemory(memory);
    if (memory?.id) {
      api.recordMemoryView(memory.id).catch(() => {});
    }
  }, [memory]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentMemory, memories]);

  if (!isOpen || !currentMemory) return null;

  const currentIndex = memories.findIndex(m => m.id === currentMemory.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < memories.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      const prev = memories[currentIndex - 1];
      setCurrentMemory(prev);
      if (onNavigate) onNavigate(prev);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      const next = memories[currentIndex + 1];
      setCurrentMemory(next);
      if (onNavigate) onNavigate(next);
    }
  };

  const handleEmojiClick = (emoji) => {
    setActiveReactionAnim(emoji);
    playTempleBell();
    setTimeout(() => setActiveReactionAnim(null), 800);

    const userId = uploaderId || 'anon-' + Date.now();
    if (onReact) {
      onReact(currentMemory.id, emoji, userId);
    }
  };

  const handleShareWhatsApp = () => {
    const utsavName = settings?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్ 2026';
    const text = `🌺 *${currentMemory.title}* 🌺\n\n` +
      `🚩 *${utsavName}* ఉత్సవ మధుర జ్ఞాపకం!\n` +
      `${currentMemory.description ? `📝 ${currentMemory.description}\n` : ''}` +
      `📸 భక్తుడు: ${currentMemory.uploaderName}\n` +
      `🗓️ దినం: ${currentMemory.day}\n\n` +
      `👉 పూర్తి జ్ఞాపకాలను దర్శించడానికి క్లిక్ చేయండి:\nhttps://ganesha-chaturthi-utsav.onrender.com`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentMemory.mediaUrl;
    link.download = `${currentMemory.title || 'ganesh_memory'}_${Date.now()}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const userReactions = currentMemory.reactedUsers?.[uploaderId] || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between animate-in fade-in duration-200">
      
      {/* Top Floating Control Bar */}
      <div className="p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 shrink-0">
            <span>🚩</span>
            <span className="truncate">{currentMemory.day}</span>
          </div>

          {currentMemory.isPinned && (
            <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-400/50 text-yellow-300 font-bold text-xs flex items-center gap-1 shrink-0 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Spotlight</span>
            </span>
          )}

          <span className="text-amber-200/80 text-xs hidden sm:inline truncate">
            {currentMemory.title}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Admin Pin Toggle */}
          {isAdmin && onPinToggle && (
            <button
              onClick={() => onPinToggle(currentMemory.id, !currentMemory.isPinned)}
              className={`p-2 rounded-full border transition-all ${
                currentMemory.isPinned
                  ? 'bg-yellow-500 text-yellow-950 border-yellow-300'
                  : 'bg-black/60 text-amber-300 border-amber-500/30 hover:bg-black'
              }`}
              title={currentMemory.isPinned ? "Unpin from spotlight" : "Pin to top spotlight"}
            >
              <Pin className="w-4 h-4" />
            </button>
          )}

          {/* WhatsApp Share Button */}
          <button
            onClick={handleShareWhatsApp}
            className="p-2 rounded-full bg-emerald-600/80 hover:bg-emerald-600 text-white border border-emerald-400/40 transition-all flex items-center gap-1.5 px-3 text-xs font-bold"
            title="Share on WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* Download Original Button */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-amber-600/80 hover:bg-amber-600 text-white border border-amber-400/40 transition-all flex items-center gap-1.5 px-3 text-xs font-bold"
            title="Download Original HD"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Delete Button (Admin or Uploader) */}
          {isOwner && onDelete && (
            <button
              onClick={() => {
                if (window.confirm('ఈ ఉత్సవ జ్ఞాపకాన్ని తొలగించాలనుకుంటున్నారా? (Are you sure you want to delete this memory?)')) {
                  onDelete(currentMemory.id);
                  onClose();
                }
              }}
              className="p-2 rounded-full bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 transition-all"
              title="Delete memory"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-amber-200 hover:text-white border border-amber-500/30 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Media Stage */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden select-none">
        
        {/* Navigation Arrows */}
        {hasPrev && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/70 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 transition-all active:scale-95 shadow-2xl"
            aria-label="Previous memory"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/70 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 transition-all active:scale-95 shadow-2xl"
            aria-label="Next memory"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        {/* Media Content */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          {currentMemory.mediaType === 'video' ? (
            <video
              src={currentMemory.mediaUrl}
              controls
              autoPlay
              playsInline
              loop
              className="max-h-[72dvh] sm:max-h-[78dvh] max-w-full rounded-2xl shadow-2xl border border-amber-500/30 object-contain bg-black"
            ></video>
          ) : currentMemory.mediaType === 'youtube' ? (
            <div className="w-[90vw] max-w-3xl aspect-video rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl">
              <iframe
                src={currentMemory.mediaUrl.replace('watch?v=', 'embed/')}
                title={currentMemory.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          ) : (
            <img
              src={currentMemory.mediaUrl}
              alt={currentMemory.title}
              className="max-h-[72dvh] sm:max-h-[78dvh] max-w-full rounded-2xl shadow-2xl border border-amber-500/30 object-contain bg-black/40"
            />
          )}

          {/* Animated Floating Reaction Chime Particle */}
          {activeReactionAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping duration-500">
              <span className="text-8xl drop-shadow-2xl">{activeReactionAnim}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info & Devotional Reaction Bar */}
      <div className="p-3.5 sm:p-5 bg-gradient-to-t from-black via-black/90 to-transparent z-20 space-y-3 shrink-0">
        
        {/* Caption & Uploader Details */}
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h4 className="font-devotional text-base sm:text-xl font-bold gold-gradient-text leading-tight">
              {currentMemory.title}
            </h4>
            {currentMemory.description && (
              <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                {currentMemory.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-amber-300/70 pt-0.5">
              <span className="flex items-center gap-1 font-semibold text-amber-200">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentMemory.uploaderName}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{new Date(currentMemory.createdAt).toLocaleDateString('te-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </span>
              {currentMemory.fileSize > 0 && (
                <>
                  <span>•</span>
                  <span>{formatBytes(currentMemory.fileSize)}</span>
                </>
              )}
              {currentMemory.viewsCount > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>{currentMemory.viewsCount} views</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Devotional Emoji Reaction Bar (1-Tap Blessing) */}
        <div className="max-w-xl mx-auto bg-[#1a0702]/90 border border-amber-500/40 rounded-2xl p-1.5 sm:p-2 flex items-center justify-around shadow-gold">
          {EMOJIS.map((emoji) => {
            const count = currentMemory.reactions?.[emoji] || 0;
            const hasReacted = userReactions.includes(emoji);

            return (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition-all active:scale-125 ${
                  hasReacted
                    ? 'bg-amber-500/30 border border-amber-400 text-amber-100 font-bold shadow-sm scale-105'
                    : 'hover:bg-amber-950/60 text-amber-300/80 hover:text-amber-100'
                }`}
              >
                <span className="text-lg sm:text-xl">{emoji}</span>
                {count > 0 && (
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-300">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
};
