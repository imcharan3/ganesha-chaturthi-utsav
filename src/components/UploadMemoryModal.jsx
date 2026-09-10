import React, { useState, useRef } from 'react';
import { X, Upload, Film, Image as ImageIcon, Sparkles, CheckCircle2, AlertCircle, Link as LinkIcon, Loader2, Play } from 'lucide-react';
import { api } from '../services/api';
import { playTempleBell } from '../utils/audio';

const CATEGORIES = [
  { id: 'alankaram', label: 'స్వామి అలంకరణ & దర్శనం', icon: '🪔' },
  { id: 'pooja', label: 'పూజలు & హారతులు', icon: '🌺' },
  { id: 'annadanam', label: 'మహా అన్నదానం', icon: '🍲' },
  { id: 'auction', label: 'లడ్డు వేలంపాట', icon: '🏆' },
  { id: 'shobhayatra', label: 'శోభాయాత్ర & నిమజ్జనం', icon: '🚩' },
  { id: 'youth', label: 'భక్తులు & యూత్ ఫోటోలు', icon: '✨' },
  { id: 'general', label: 'ఇతర జ్ఞాపకాలు', icon: '📸' }
];

const DAYS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'నిమజ్జనం (Nimajjanam)', 'All Days'];

export const UploadMemoryModal = ({ isOpen, onClose, onUploadSuccess, settings }) => {
  const [activeMode, setActiveMode] = useState('file'); // 'file' | 'link'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video' | 'youtube'
  const [externalUrl, setExternalUrl] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploaderName, setUploaderName] = useState(() => localStorage.getItem('ganesh_user_name') || '');
  const [category, setCategory] = useState('alankaram');
  const [day, setDay] = useState('Day 1');
  
  const [uploadProgress, setUploadProgress] = useState(null); // { loaded, total, percent }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Extract first frame of video as high-quality preview thumbnail
  const extractVideoFrame = (file) => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.src = URL.createObjectURL(file);

        video.onloadeddata = () => {
          video.currentTime = Math.min(1.0, (video.duration || 1) / 2);
        };

        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(thumbDataUrl);
        };

        video.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError('');
    // 1GB check
    if (file.size > 1024 * 1024 * 1024) {
      setUploadError('ఫైల్ పరిమాణం 1GB కంటే తక్కువగా ఉండాలి (File size must be under 1GB).');
      return;
    }

    setSelectedFile(file);
    const isVid = file.type.startsWith('video/');
    setMediaType(isVid ? 'video' : 'image');

    if (isVid) {
      const objUrl = URL.createObjectURL(file);
      setFilePreview(objUrl);
      const thumb = await extractVideoFrame(file);
      setVideoThumbnail(thumb);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFilePreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');

    if (activeMode === 'file' && !selectedFile) {
      setUploadError('దయచేసి ఫోటో లేదా వీడియో ఫైల్‌ను ఎంచుకోండి (Please select a media file).');
      return;
    }
    if (activeMode === 'link' && !externalUrl.trim()) {
      setUploadError('దయచేసి వీడియో లేదా ఫోటో లింక్ నమోదు చేయండి (Please enter a valid URL).');
      return;
    }

    const savedUploader = uploaderName.trim() || 'భక్తుడు';
    localStorage.setItem('ganesh_user_name', savedUploader);

    // Get or create unique uploaderId for device
    let uploaderId = localStorage.getItem('ganesh_uploader_id');
    if (!uploaderId) {
      uploaderId = 'usr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      localStorage.setItem('ganesh_uploader_id', uploaderId);
    }

    setIsUploading(true);
    setUploadProgress({ loaded: 0, total: 100, percent: 5 });

    try {
      let finalMediaUrl = '';
      let finalThumbUrl = '';
      let calculatedSize = 0;

      if (activeMode === 'file') {
        calculatedSize = selectedFile.size;

        // 1. Ensure server is awake
        try {
          await api.getSettings();
        } catch (e) {
          console.warn('Server warmup ping:', e);
        }

        try {
          // 2. Primary: Upload with real-time percentage progress
          const uploadRes = await api.uploadMediaFileWithProgress(selectedFile, (prog) => {
            setUploadProgress(prog);
          });

          finalMediaUrl = uploadRes.mediaUrl;
          finalThumbUrl = videoThumbnail || finalMediaUrl;
        } catch (uploadErr) {
          console.warn('Multipart upload failed, attempting smart direct fallback...', uploadErr);
          
          // 3. Fallback: Convert to Data URL and send directly in JSON payload
          if (filePreview && typeof filePreview === 'string' && filePreview.startsWith('data:')) {
            finalMediaUrl = filePreview;
            finalThumbUrl = videoThumbnail || filePreview;
          } else {
            const dataUrl = await new Promise((res, rej) => {
              const reader = new FileReader();
              reader.onload = () => res(reader.result);
              reader.onerror = rej;
              reader.readAsDataURL(selectedFile);
            });
            finalMediaUrl = dataUrl;
            finalThumbUrl = videoThumbnail || (mediaType === 'video' ? '/mandapam_bg.jpg' : dataUrl);
          }
        }
      } else {
        // Link mode (e.g. YouTube / Cloud storage)
        finalMediaUrl = externalUrl.trim();
        const isYt = finalMediaUrl.includes('youtube.com') || finalMediaUrl.includes('youtu.be');
        setMediaType(isYt ? 'youtube' : 'video');
        finalThumbUrl = isYt ? '/mandapam_bg.jpg' : finalMediaUrl;
      }

      // Create Memory record
      const memoryPayload = {
        title: title.trim() || 'శ్రీ వినాయక ఉత్సవ జ్ఞాపకం',
        description: description.trim(),
        mediaUrl: finalMediaUrl,
        mediaType,
        thumbnailUrl: finalThumbUrl,
        fileSize: calculatedSize,
        uploaderName: savedUploader,
        uploaderRole: 'Devotee',
        uploaderId,
        category,
        day,
        isPinned: false
      };

      const result = await api.createMemory(memoryPayload);
      playTempleBell();

      if (onUploadSuccess) {
        onUploadSuccess(result.memory || result);
      }

      resetAndClose();
    } catch (err) {
      console.error('Memory upload error:', err);
      setUploadError(err.message || 'మీడియా అప్‌లోడ్ విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setVideoThumbnail(null);
    setTitle('');
    setDescription('');
    setExternalUrl('');
    setUploadProgress(null);
    setUploadError('');
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#120502] border-2 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94dvh] flex flex-col">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-crimson-900 via-saffron-800 to-crimson-900 p-3.5 sm:p-4 text-center relative border-b border-amber-500/30 shrink-0">
          <button
            onClick={resetAndClose}
            disabled={isUploading}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-amber-200 hover:text-white transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 bg-black/30 px-3 py-0.5 rounded-full text-[11px] font-semibold text-amber-300 border border-amber-500/20 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>ఉత్సవ జ్ఞాపకాలు భద్రపరచండి • Ultra-HD (1GB)</span>
          </div>
          <h3 className="font-devotional text-base sm:text-lg font-bold gold-gradient-text">
            ఫోటో / వీడియో అప్‌లోడ్ చేయండి (Upload Memories)
          </h3>
          <p className="text-[11px] text-amber-200/80">
            {settings?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్ 2026'}
          </p>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs">
          
          {/* Mode Switcher: Direct File vs Cloud Link */}
          <div className="flex bg-[#180702] p-1 rounded-2xl border border-amber-500/30">
            <button
              type="button"
              onClick={() => setActiveMode('file')}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'file'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-amber-300/70 hover:text-amber-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>ఫోటో / వీడియో ఫైల్ (Up to 1GB)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('link')}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'link'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-amber-300/70 hover:text-amber-200'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>YouTube / వెబ్ లింక్</span>
            </button>
          </div>

          {/* Mode 1: Direct File Drop / Upload */}
          {activeMode === 'file' && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-[#1a0703]/80 hover:bg-[#220a04] rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2.5 group"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-500/15 group-hover:bg-amber-500/25 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 transition-transform group-hover:scale-110">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-amber-200 font-bold text-sm">
                      ఫోటో లేదా వీడియోను ఇక్కడ ఎంచుకోండి
                    </p>
                    <p className="text-amber-400/60 text-[11px] mt-0.5">
                      JPG, PNG, WEBP, MP4, MOV, WEBM • ఒరిజినల్ క్వాలిటీ (గరిష్టంగా 1GB వరకు)
                    </p>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-[11px] border border-amber-500/30">
                    Browse File 📂
                  </span>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-amber-500/40 bg-black/60 p-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-black flex items-center justify-center shrink-0 border border-amber-500/30 relative">
                      {mediaType === 'video' ? (
                        videoThumbnail ? (
                          <>
                            <img src={videoThumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Play className="w-5 h-5 text-white fill-white" />
                            </div>
                          </>
                        ) : (
                          <Film className="w-8 h-8 text-amber-400" />
                        )
                      ) : (
                        <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
                          {mediaType}
                        </span>
                        <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ఒరిజినల్ క్వాలిటీ
                        </span>
                      </div>
                      <p className="text-amber-100 font-bold text-xs truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-amber-400/70 text-[11px]">
                        పరిమాణం: {formatFileSize(selectedFile.size)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        setVideoThumbnail(null);
                      }}
                      className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: External Video / YouTube Link */}
          {activeMode === 'link' && (
            <div>
              <label className="block text-amber-300/90 font-semibold mb-1">
                వీడియో లేదా ఫోటో URL / YouTube Link *
              </label>
              <input
                type="url"
                required={activeMode === 'link'}
                placeholder="e.g. https://www.youtube.com/watch?v=... or https://drive.google.com/..."
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#170702] border border-amber-500/40 text-amber-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-amber-300/90 font-semibold mb-1">
                మీ పేరు / కుటుంబం (Uploader Name) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. చరణ్ తేజ & యూత్"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-amber-300/90 font-semibold mb-1">
                ఉత్సవ దినం (Celebration Day)
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 font-bold focus:outline-none"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-amber-300/90 font-semibold mb-1.5">
              విభాగం ఎంచుకోండి (Category) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all ${
                    category === cat.id
                      ? 'bg-amber-500/25 border-amber-400 text-amber-100 font-bold shadow-sm'
                      : 'bg-[#180702] border-amber-500/20 text-amber-300/70 hover:text-amber-200'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="truncate text-[11px]">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-amber-300/90 font-semibold mb-1">
              శీర్షిక / జ్ఞాపకం పేరు (Title / Caption) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. మూడవ రోజు మహా అన్నదాన వేడుక & విశేష హారతి"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-amber-300/90 font-semibold mb-1">
              వివరాలు / భక్తిపూర్వక సందేశం (Devotional Note - Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. కాలనీ భక్తులందరూ ఉత్సాహంగా పాల్గొని స్వామివారి కృపకు పాత్రులయ్యారు."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none resize-none"
            ></textarea>
          </div>

          {/* Upload Progress Bar (High-res 1GB) */}
          {isUploading && uploadProgress && (
            <div className="p-3 bg-[#180702] border border-amber-500/30 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-amber-200 font-semibold text-xs">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Ultra-HD మీడియా అప్‌లోడ్ అవుతోంది...</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">{uploadProgress.percent}%</span>
              </div>

              <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-amber-500/20">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress.percent}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[10px] text-amber-400/70 font-mono">
                <span>{formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)}</span>
                <span>Pristine Quality Stream</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {uploadError && (
            <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-saffron-500 to-orange-600 text-white font-bold text-sm shadow-gold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>అప్‌లోడ్ పూర్తవుతోంది ({uploadProgress?.percent || 0}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-yellow-200" />
                  <span>జ్ఞాపకాన్ని భద్రపరచండి (Save Memory 📸)</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
