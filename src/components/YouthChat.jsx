import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, Square, Trash2, Image as ImageIcon, CornerDownLeft, 
  Smile, Play, Pause, Volume2, User, Sparkles, Check, X, Shield, Paperclip, MessageSquare 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';

const DEVOTIONAL_EMOJIS = ['🪔', '🙏', '🌺', '🐘', '🚩', '🥥', '🍬'];
const ROLE_SUGGESTIONS = [
  'Youth President', 
  'Decoration Team', 
  'Prasadam Lead', 
  'Sound & Lighting', 
  'Vutti Incharge', 
  'Volunteer',
  'Devotee'
];

export const YouthChat = ({ messages, onRefreshMessages }) => {
  const { isAdmin, adminToken } = useAuth();
  const { socket } = useSocket();

  // Persistent Client Sender ID & User Profile (zero login friction)
  const [senderId] = useState(() => {
    let id = localStorage.getItem('ganesh_sender_id');
    if (!id) {
      id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
      localStorage.setItem('ganesh_sender_id', id);
    }
    return id;
  });

  const [userName, setUserName] = useState(() => localStorage.getItem('ganesh_chat_user') || '');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('ganesh_chat_role') || 'Youth Member');
  const [isEditingProfile, setIsEditingProfile] = useState(!userName);

  // Message Form State
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageModal, setImageModal] = useState(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Voice Recording
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Voice recording is not supported in this browser. Please use text or images.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Could not access microphone. Please allow microphone permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordTimerRef.current);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setRecordDuration(0);
  };

  const handleSendVoiceNote = async () => {
    if (!recordedAudioBlob) return;
    const effectiveName = userName.trim() || 'Devotee';
    if (!userName.trim()) {
      setUserName('Devotee');
      localStorage.setItem('ganesh_chat_user', 'Devotee');
    }

    setIsUploading(true);
    try {
      const uploadRes = await api.uploadAudio(recordedAudioBlob);
      await api.sendMessage({
        sender: effectiveName,
        senderId: senderId,
        role: userRole,
        type: 'voice',
        mediaUrl: uploadRes.fileUrl,
        duration: recordDuration || 5,
        replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender, text: replyingTo.text || 'Voice Message' } : null
      });

      cancelRecording();
      setReplyingTo(null);
      if (onRefreshMessages) onRefreshMessages();
    } catch (err) {
      alert(err.message || 'Failed to send voice note');
    } finally {
      setIsUploading(false);
    }
  };

  // Image Upload Handling
  const handleSelectImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const effectiveName = userName.trim() || 'Devotee';
    if (!userName.trim()) {
      setUserName('Devotee');
      localStorage.setItem('ganesh_chat_user', 'Devotee');
    }

    setIsUploading(true);
    try {
      const uploadRes = await api.uploadImage(file);
      setPreviewImage(uploadRes.fileUrl);
    } catch (err) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  // Text / Image Message Submission
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend && !previewImage) return;

    const effectiveName = userName.trim() || 'Devotee';
    if (!userName.trim()) {
      setUserName('Devotee');
      localStorage.setItem('ganesh_chat_user', 'Devotee');
    }

    setIsUploading(true);
    try {
      await api.sendMessage({
        sender: effectiveName,
        senderId: senderId,
        role: userRole,
        text: textToSend,
        type: previewImage ? 'image' : 'text',
        mediaUrl: previewImage || null,
        replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender, text: replyingTo.text || (replyingTo.type === 'voice' ? '🎤 Voice Note' : '📷 Image') } : null
      });

      setInputText('');
      setPreviewImage(null);
      setReplyingTo(null);
      if (onRefreshMessages) onRefreshMessages();
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsUploading(false);
    }
  };

  // Devotional Reactions
  const handleReact = async (messageId, emoji) => {
    try {
      await api.reactToMessage(messageId, emoji);
      if (onRefreshMessages) onRefreshMessages();
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  // Message Moderation & Self-Deletion (Sender OR Admin)
  const handleDeleteMessage = async (msg) => {
    const isOwner = (msg.senderId && msg.senderId === senderId) || (msg.sender === userName);
    const confirmPrompt = isOwner
      ? 'Are you sure you want to delete this message?'
      : 'Admin: Delete this message from community chat?';
    
    if (!window.confirm(confirmPrompt)) return;

    try {
      await api.deleteMessage(msg.id, {
        token: adminToken,
        senderId: senderId,
        senderName: userName
      });
      if (onRefreshMessages) onRefreshMessages();
    } catch (err) {
      alert(err.message || 'Failed to delete message');
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!userName.trim()) return;
    localStorage.setItem('ganesh_chat_user', userName.trim());
    localStorage.setItem('ganesh_chat_role', userRole);
    setIsEditingProfile(false);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-4">
      
      {/* Header Banner */}
      <div className="temple-card p-4 sm:p-5 rounded-3xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-crimson-700 p-0.5 shadow-gold flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-2xl bg-[#200b05] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <h2 className="font-devotional text-lg sm:text-xl font-bold gold-gradient-text">
              యువజన చర్చా వేదిక (Youth Community Chat)
            </h2>
            <p className="text-xs text-amber-200/80">
              Open discussion for mandapam arrangements, prasad, & live voice notes
            </p>
          </div>
        </div>

        {/* User Badge / Profile Switcher */}
        <div className="flex items-center gap-2">
          {userName && !isEditingProfile ? (
            <div 
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center gap-2 bg-[#2b1007] hover:bg-[#38160b] border border-amber-500/30 px-3 py-1.5 rounded-xl cursor-pointer transition-all text-xs"
              title="Click to change your name or role"
            >
              <div className="w-6 h-6 rounded-full bg-saffron-500/20 text-saffron-400 flex items-center justify-center font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-bold text-amber-100 block">{userName}</span>
                <span className="text-[10px] text-amber-400/70 block">{userRole}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold"
            >
              Set My Name & Role
            </button>
          )}
        </div>
      </div>

      {/* Set Profile Card (if empty or editing) */}
      {isEditingProfile && (
        <div className="bg-[#240e06] p-4 rounded-2xl border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-400" />
              <span>Join Chat (No login required - Enter your name)</span>
            </h4>
            {userName && (
              <button onClick={() => setIsEditingProfile(false)} className="text-amber-400 text-xs">
                Close
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <input
                type="text"
                required
                placeholder="Your Name (e.g. Ramesh)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400"
              >
                {ROLE_SUGGESTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold text-xs hover:brightness-110 shadow-gold"
            >
              Start Chatting 💬
            </button>
          </form>
        </div>
      )}

      {/* Main Messages Inbox Container */}
      <div className="temple-card rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col h-[520px]">
        
        {/* Instagram Announcement Banner */}
        <a
          href="https://instagram.com/vijayacolony_ganesha_diaries"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-pink-950/70 via-[#2a091d] to-purple-950/70 p-2.5 px-4 border-b border-pink-500/30 flex items-center justify-between text-xs text-pink-200 hover:text-white transition-all shrink-0"
        >
          <div className="flex items-center gap-2">
            <span>📸</span>
            <span>Official Darshan & Reels: <strong>@vijayacolony_ganesha_diaries</strong></span>
          </div>
          <span className="text-[11px] text-pink-300 font-bold underline">Follow Page ➔</span>
        </a>

        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
          {(!messages || messages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-amber-300/60 space-y-2">
              <MessageSquare className="w-10 h-10 text-amber-500/40" />
              <p className="text-sm font-semibold text-amber-200">No messages in discussion yet</p>
              <p className="text-xs">Be the first to share an update or send a voice message!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = (msg.senderId && msg.senderId === senderId) || (msg.sender === userName);
              const canDelete = isMe || isAdmin;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 group`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center gap-1.5 text-[11px] px-1 text-amber-300/80">
                    <span className="font-bold text-amber-200">{msg.sender} {isMe && <span className="text-[10px] text-amber-400 font-normal">(You)</span>}</span>
                    <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded border border-amber-500/20 text-amber-400/70">
                      {msg.role || 'Member'}
                    </span>
                    <span className="text-[10px] text-amber-400/50">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Quoted / Replied Message */}
                  {msg.replyTo && (
                    <div className="text-[11px] bg-black/40 border-l-2 border-amber-400 px-2 py-1 rounded-r-lg text-amber-300/80 max-w-sm italic mb-0.5">
                      <span className="font-bold text-amber-200">@{msg.replyTo.sender}:</span> {msg.replyTo.text}
                    </div>
                  )}

                  {/* Message Body Card */}
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl relative shadow-md ${
                      isMe
                        ? 'bg-gradient-to-br from-[#41190d] to-[#2b0f07] border border-amber-500/40 text-amber-50 rounded-tr-xs'
                        : 'bg-[#1e0a04] border border-amber-500/25 text-amber-100 rounded-tl-xs'
                    }`}
                  >
                    {/* Text content */}
                    {msg.text && (
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    )}

                    {/* Image attachment */}
                    {msg.type === 'image' && msg.mediaUrl && (
                      <div className="mt-1.5 rounded-xl overflow-hidden cursor-pointer" onClick={() => setImageModal(msg.mediaUrl)}>
                        <img
                          src={msg.mediaUrl}
                          alt="Uploaded attachment"
                          className="w-full max-h-60 object-cover rounded-xl hover:scale-102 transition-transform"
                        />
                      </div>
                    )}

                    {/* Voice message note */}
                    {msg.type === 'voice' && msg.mediaUrl && (
                      <VoiceMessagePlayer audioUrl={msg.mediaUrl} duration={msg.duration} />
                    )}

                    {/* Reactions Display */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-amber-500/15">
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(msg.id, emoji)}
                            className="text-[11px] bg-black/40 hover:bg-amber-950/60 px-1.5 py-0.5 rounded-full border border-amber-500/20 text-amber-200 flex items-center gap-1 transition-all"
                          >
                            <span>{emoji}</span>
                            <span className="font-bold text-[10px]">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Action Strip (Reply, React, Delete) */}
                  <div className="flex items-center gap-2 px-1 text-xs opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="text-[11px] text-amber-400/80 hover:text-amber-200 flex items-center gap-1"
                    >
                      <CornerDownLeft className="w-3 h-3" />
                      <span>Reply</span>
                    </button>

                    {/* Quick Emojis */}
                    <div className="flex items-center gap-1">
                      {DEVOTIONAL_EMOJIS.slice(0, 4).map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji)}
                          className="text-xs hover:scale-130 transition-transform"
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Delete Action (Available to Sender OR Admin) */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(msg)}
                        className={`p-1 rounded transition-all ${
                          isMe ? 'text-amber-400/70 hover:text-red-400' : 'text-red-400 hover:text-red-300'
                        }`}
                        title={isMe ? 'Delete your message' : 'Admin: Delete message'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Replying Banner */}
        {replyingTo && (
          <div className="bg-[#2a0f06] px-4 py-2 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <CornerDownLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Replying to <strong className="text-amber-300">@{replyingTo.sender}</strong>: <span className="italic text-amber-400/70 truncate max-w-xs">{replyingTo.text || 'media'}</span></span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="text-amber-400 hover:text-amber-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Selected Image Preview before sending */}
        {previewImage && (
          <div className="bg-[#2a0f06] p-2 border-t border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={previewImage} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-amber-500/40" />
              <span className="text-xs text-amber-300">Photo attached ✅</span>
            </div>
            <button onClick={() => setPreviewImage(null)} className="p-1 text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Voice Note Recording Overlay / Controller */}
        {isRecording ? (
          <div className="bg-[#260c05] p-3 border-t border-amber-500/40 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
              <span className="text-xs font-bold text-red-400 font-mono">
                Recording Voice Note: {formatTimer(recordDuration)}
              </span>
              
              {/* Waveform Bars */}
              <div className="flex items-center gap-1 h-6">
                <span className="w-1 bg-amber-400 rounded-full audio-wave-bar"></span>
                <span className="w-1 bg-amber-400 rounded-full audio-wave-bar"></span>
                <span className="w-1 bg-amber-400 rounded-full audio-wave-bar"></span>
                <span className="w-1 bg-amber-400 rounded-full audio-wave-bar"></span>
                <span className="w-1 bg-amber-400 rounded-full audio-wave-bar"></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={cancelRecording}
                className="px-3 py-1 rounded-xl bg-black/40 text-xs text-amber-300 hover:text-red-300 border border-amber-500/20"
              >
                Cancel
              </button>
              <button
                onClick={stopRecording}
                className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Done</span>
              </button>
            </div>
          </div>
        ) : recordedAudioBlob ? (
          /* Recorded Audio Preview before Sending */
          <div className="bg-[#260c05] p-3 border-t border-amber-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <audio src={recordedAudioUrl} controls className="h-8 w-full max-w-xs" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cancelRecording}
                className="p-2 rounded-xl bg-black/40 text-red-400 hover:bg-black/60"
                title="Discard recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleSendVoiceNote}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold text-xs flex items-center gap-1.5 shadow-gold hover:brightness-110"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Voice</span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard Message Input Bar */
          <div className="border-t border-amber-500/30">
            {/* Quick Sender Identity Strip */}
            <div className="bg-[#140502] px-3 py-1 flex items-center justify-between text-[11px] text-amber-300/80 border-b border-amber-500/15">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400/60">Posting as:</span>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="font-bold text-amber-200 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 hover:border-amber-400 hover:text-amber-100 flex items-center gap-1"
                  title="Click to edit display name or role"
                >
                  <span>{userName || 'Devotee (భక్తుడు)'}</span>
                  <span className="text-[9px] text-amber-400/60">({userRole}) ✏️</span>
                </button>
              </div>
              <span className="text-[10px] text-amber-400/50 hidden sm:inline">Press Enter to send 💬</span>
            </div>

            <form onSubmit={handleSendMessage} className="bg-[#1a0703] p-2.5 sm:p-3 flex items-center gap-2">
              
              {/* Image Attachment Trigger */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleSelectImage}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-[#280f08] border border-amber-500/30 text-amber-400 hover:text-amber-200 hover:border-amber-400 transition-all"
                title="Attach Festival Photo"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Voice Record Trigger */}
              <button
                type="button"
                onClick={startRecording}
                className="p-2 rounded-xl bg-[#280f08] border border-amber-500/30 text-saffron-400 hover:text-saffron-200 hover:border-saffron-400 transition-all"
                title="Record Voice Note"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                placeholder={userName ? `Message as ${userName}...` : "Type your message (or enter your name above)..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#260e07] border border-amber-500/30 text-amber-100 text-xs sm:text-sm focus:outline-none focus:border-amber-400 placeholder:text-amber-400/40"
              />

              {/* Send CTA Button */}
              <button
                type="submit"
                disabled={isUploading || (!inputText.trim() && !previewImage)}
                className="p-2.5 sm:px-4 rounded-xl bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-600 text-amber-950 font-bold text-xs sm:text-sm shadow-gold hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>

            </form>
          </div>
        )}

      </div>

      {/* Image Zoom Lightbox Modal */}
      {imageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img src={imageModal} alt="Enlarged view" className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-amber-500/40 shadow-2xl" />
            <button 
              onClick={() => setImageModal(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

/**
 * Custom Devotional Voice Message Player Component
 */
const VoiceMessagePlayer = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const toggleSpeed = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 bg-black/30 p-1.5 sm:p-2 rounded-xl border border-amber-500/20 w-full max-w-[210px] sm:max-w-[260px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />

      <button
        onClick={togglePlay}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 flex items-center justify-center shadow-gold hover:scale-105 transition-transform shrink-0"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-amber-950" /> : <Play className="w-3.5 h-3.5 fill-amber-950 ml-0.5" />}
      </button>

      {/* Waveform Visualization Bars */}
      <div className="flex-1 flex items-center gap-0.5 sm:gap-1 h-5 overflow-hidden">
        {[40, 75, 55, 90, 60, 80, 45, 95, 70, 50, 85, 60, 40].map((height, i) => (
          <span
            key={i}
            className={`w-0.5 sm:w-1 rounded-full transition-all ${
              isPlaying ? 'bg-amber-400' : 'bg-amber-500/40'
            }`}
            style={{
              height: `${height}%`,
              opacity: (currentTime / (duration || 5)) > (i / 13) ? 1 : 0.4
            }}
          ></span>
        ))}
      </div>

      {/* Playback speed toggle */}
      <button
        onClick={toggleSpeed}
        className="text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500 hover:text-amber-950 transition-all shrink-0"
        title="Toggle Playback Speed"
      >
        {playbackSpeed}x
      </button>
    </div>
  );
};
