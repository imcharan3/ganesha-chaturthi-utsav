import React, { useState, useEffect } from 'react';
import { 
  Heart, Calendar, MessageSquare, MapPin, Sparkles, Trophy, 
  Users, ShieldCheck, ChevronRight, Share2, Crown, Download, Flame, ArrowRight, FileText 
} from 'lucide-react';
import { generateAuctionPoster, downloadAuctionPoster, shareAuctionPoster } from '../utils/generateAuctionPoster';
import { generateAuctionPdf } from '../utils/generateAuctionPdf';

export const HeroSection = ({ stats, settings, auction, onOpenDonation, setActiveTab }) => {
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState({
    days: 12,
    hours: 8,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    // Default festival target date or from settings
    const targetDate = new Date(settings?.startDate || '2026-09-14T08:00:00.000Z').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings?.startDate]);

  const targetAmount = settings?.targetAmount || 70000;
  const currentTotal = stats?.totalAmount || 0;
  const progressPercent = Math.min(100, Math.round((currentTotal / targetAmount) * 100));

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: settings?.utsavName || 'Vinayaka Chavithi Utsav 2026',
        text: 'Join us in celebrating Ganesh Chaturthi 2026! Check events, donate, and chat with youth members:',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard! Share it on WhatsApp 🌺');
    }
  };

  const handleDownloadWinnerPoster = async () => {
    if (!auction?.winner) return;
    setIsGeneratingPoster(true);
    try {
      const canvas = await generateAuctionPoster({ ...auction.winner, ladduWeight: auction.ladduWeight || '21 KG' }, settings);
      downloadAuctionPoster(canvas, `Ganesha_Laddu_Winner_${auction.winner.name.replace(/\s+/g, '_')}.png`);
    } catch (e) {
      alert('Error generating poster');
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const handleShareWinnerPoster = async () => {
    if (!auction?.winner) return;
    setIsGeneratingPoster(true);
    try {
      const canvas = await generateAuctionPoster({ ...auction.winner, ladduWeight: auction.ladduWeight || '21 KG' }, settings);
      await shareAuctionPoster(canvas, { ...auction.winner, ladduWeight: auction.ladduWeight || '21 KG' }, settings);
    } catch (e) {
      alert('Error sharing poster');
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateAuctionPdf(auction, settings);
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF report');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isAuctionLive = auction?.status === 'live';
  const hasAuctionWinner = (auction?.status === 'completed' || auction?.winner) && auction?.winner?.name;

  return (
    <div className="relative overflow-hidden pt-4 pb-12 sm:pt-8 sm:pb-16 space-y-6">
      
      {/* Devotional Glow Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-gradient-to-tr from-saffron-600/20 via-amber-500/20 to-crimson-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* LIVE AUCTION CALLOUT BANNER (WHEN LIVE) */}
        {isAuctionLive && (
          <div 
            onClick={() => setActiveTab('auction')}
            className="cursor-pointer bg-gradient-to-r from-red-950 via-[#350f06] to-red-950 border-2 border-red-500/70 p-3 sm:p-4 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.35)] flex items-center justify-between gap-3 animate-pulse group hover:border-red-400 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0 shadow-lg">
                <Flame className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                  <h4 className="font-bold text-sm sm:text-base text-white">
                    ప్రత్యక్ష లడ్డూ వేలం పాట జరుగుతోంది! (LIVE AUCTION)
                  </h4>
                </div>
                <p className="text-xs text-amber-200/90">
                  Current Highest Bid: <strong className="text-amber-300 font-mono text-sm">₹{Number(auction?.currentHighestBid || 5001).toLocaleString('en-IN')}</strong> {auction?.highestBidderName && `by ${auction.highestBidderName}`}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-black text-xs shadow-gold group-hover:brightness-110">
              <span>Watch & Bid</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* MAHA LADDU AUCTION WINNER ROYAL SHOWCASE (WHEN COMPLETED) */}
        {hasAuctionWinner && (
          <div className="temple-card p-5 sm:p-7 rounded-3xl border-2 border-amber-400 shadow-[0_12px_35px_rgba(245,158,11,0.22)] relative overflow-hidden bg-gradient-to-br from-[#2a0e05] via-[#1a0703] to-[#240e06] text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 font-black px-4 py-1 rounded-full text-xs shadow-gold">
              <Crown className="w-3.5 h-3.5 fill-amber-950" />
              <span>శ్రీ వినాయక మహా లడ్డూ ప్రసాదం వేలం విజేత • AUCTION WINNER</span>
              <Crown className="w-3.5 h-3.5 fill-amber-950" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white font-devotional">
                {auction.winner.name}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-amber-300">
                గోత్రం: <span className="text-amber-100">{auction.winner.gotram || 'శివ గోత్రం'}</span> • లడ్డూ బరువు: <strong className="text-amber-200">{auction.ladduWeight || '21 KG'}</strong> • గెలుచుకున్న మొత్తం: <strong className="text-amber-300 font-mono text-base sm:text-xl font-black">₹{Number(auction.winner.winningBid).toLocaleString('en-IN')}</strong>
              </p>
            </div>

            {/* Poster & PDF Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                onClick={handleShareWinnerPoster}
                disabled={isGeneratingPoster}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isGeneratingPoster ? 'Generating...' : 'Share Poster on WhatsApp'}</span>
              </button>

              <button
                onClick={handleDownloadWinnerPoster}
                disabled={isGeneratingPoster}
                className="px-4 py-2 rounded-xl bg-[#2b1008] hover:bg-[#3d170b] border border-amber-500/50 text-amber-200 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download Poster (PNG)</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-400/50 text-amber-100 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>Download PDF Report</span>
              </button>

              <button
                onClick={() => setActiveTab('auction')}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center gap-1"
              >
                <span>View Full Auction Details ➔</span>
              </button>
            </div>
          </div>
        )}

        {/* Sanskrit Shloka Banner */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs sm:text-sm shadow-inner mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>మంగళకరమైన శ్లోకం</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <p className="font-devotional text-sm sm:text-lg text-amber-200/95 tracking-wide italic font-semibold">
            "వక్రతుండ మహాకాయ సూర్యకోటి సమప్రభ | నిర్విఘ్నం కురు మే దేవ సర్వకార్యేషు సర్వదా ||"
          </p>
          <p className="text-[11px] sm:text-xs text-amber-400/70 mt-1">
            (O Lord with curved trunk and radiant aura of a crore suns, remove all obstacles from our paths always.)
          </p>
        </div>

        {/* Hero Grid: Center Ganesha & Interactive Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Festival Info & Call to Actions (5 Cols) */}
          <div className="lg:col-span-5 text-center lg:text-left space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-crimson-950/80 border border-crimson-600/40 text-amber-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>4-Day Grand Celebrations 2026</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-devotional leading-tight tracking-tight">
              <span className="gold-gradient-text block">గణపతి బప్పా మోరియా!</span>
              <span className="text-2xl sm:text-3xl font-telugu text-amber-100 mt-2 block">
                {settings?.utsavName || 'శ్రీ వినాయక చవితి ఉత్సవాలు'}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-amber-200/85 leading-relaxed font-normal">
              విఘ్నరాజుని కృపాకటాక్షాలతో మన వీధిలో 4 రోజుల పాటు అత్యంత వైభవంగా నిర్వహించే వినాయక చవితి వేడుకలకు భక్తులందరికీ సాదర స్వాగతం.
            </p>

            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm text-amber-300/90 bg-black/30 p-2.5 rounded-xl border border-amber-500/20">
              <MapPin className="w-4 h-4 text-saffron-400 shrink-0" />
              <span>{settings?.location || 'Main Mandapam, Main Road'}</span>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button
                onClick={onOpenDonation}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-600 text-amber-950 font-bold text-base shadow-divine hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                <Heart className="w-5 h-5 text-crimson-900 fill-crimson-900 group-hover:scale-125 transition-transform" />
                <span>Donate Now (విరాళం)</span>
              </button>

              <button
                onClick={() => setActiveTab('donors')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[#260f07] hover:bg-[#34160a] border border-amber-500/40 text-amber-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>Donors List (దాతలు)</span>
              </button>
            </div>

            {/* Quick Actions Strip */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs">
              <button
                onClick={handleShare}
                className="text-amber-400/80 hover:text-amber-200 flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Mandapam on WhatsApp</span>
              </button>

              <span className="text-amber-500/40 hidden sm:inline">•</span>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-install-modal'));
                }}
                className="text-amber-300 hover:text-amber-100 flex items-center gap-1.5 transition-colors font-semibold"
              >
                <span>📲</span>
                <span className="underline">Install Mobile App (యాప్ డౌన్‌లోడ్)</span>
              </button>
            </div>
          </div>

          {/* Center Column: Lord Ganesha Devotional Visual (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center animate-float">
              
              {/* Outer Golden Aura Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40 animate-spin" style={{ animationDuration: '35s' }}></div>
              <div className="absolute inset-2 sm:inset-3 rounded-full border border-amber-500/30"></div>
              <div className="absolute inset-4 sm:inset-6 rounded-full bg-gradient-to-b from-amber-500/10 via-saffron-600/20 to-crimson-900/30 blur-md"></div>
              
              {/* Center Ganesha & Colony Logo Artwork */}
              <div className="relative z-10 w-38 h-38 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-[#1b3d22] to-[#0a180d] border-2 border-amber-400 p-1 shadow-divine flex items-center justify-center overflow-hidden">
                <img 
                  src="/colony_logo.jpg" 
                  alt="Vijaya Colony Ganesha Youth" 
                  className="w-full h-full object-cover rounded-full filter drop-shadow-[0_4px_12px_rgba(255,215,0,0.7)]"
                />
              </div>

              {/* Decorative Diya lights on sides */}
              <div className="absolute -bottom-1 sm:-bottom-2 -left-1 sm:-left-2 bg-amber-950/90 border border-amber-500/50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs text-amber-300 font-semibold shadow-gold flex items-center gap-1 animate-flicker">
                <span>🪔</span>
                <span>శుభం</span>
              </div>
              <div className="absolute -bottom-1 sm:-bottom-2 -right-1 sm:-right-2 bg-amber-950/90 border border-amber-500/50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs text-amber-300 font-semibold shadow-gold flex items-center gap-1 animate-flicker">
                <span>లాభం</span>
                <span>🪔</span>
              </div>
            </div>

            {/* Auspicious Badge */}
            <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-amber-300/90 bg-amber-950/50 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-amber-500/30">
              <span>🌺 విజయ కాలనీ గణేష్ యూత్ 🌺</span>
            </div>
          </div>

          {/* Right Column: Live Donation Ticker & Countdown (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Live Donation Meter Card */}
            <div className="temple-card p-5 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Donations Live Ticker</span>
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/40 animate-pulse">
                  Live
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-amber-200/70">Total Collected So Far</p>
                <p className="text-2xl sm:text-3xl font-extrabold gold-gradient-text">
                  ₹{currentTotal.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-amber-300/80">
                  <span>Target: ₹{targetAmount.toLocaleString('en-IN')}</span>
                  <span className="font-bold text-amber-300">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#170602] rounded-full overflow-hidden p-0.5 border border-amber-500/30">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-saffron-500 to-yellow-400 transition-all duration-1000 shadow-gold"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Mini Grid */}
              <div className="mt-4 pt-3 border-t border-amber-500/20 grid grid-cols-2 gap-2 text-center">
                <div className="bg-black/30 p-2 rounded-xl border border-amber-500/10">
                  <p className="text-[10px] text-amber-300/70">Total Donors</p>
                  <p className="text-base font-bold text-amber-100">{stats?.totalDonors || 0}</p>
                </div>
                <div className="bg-black/30 p-2 rounded-xl border border-amber-500/10">
                  <p className="text-[10px] text-amber-300/70">Events Days</p>
                  <p className="text-base font-bold text-amber-100">4 Days</p>
                </div>
              </div>
            </div>

            {/* Festival Countdown Card */}
            <div className="temple-card p-4 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-saffron-400" />
                  <span>Utsav Countdown</span>
                </span>
                <span className="text-[10px] text-amber-400/80">Day 1 Pratistha</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-[#1c0803] p-1.5 rounded-lg border border-amber-500/30">
                  <span className="block text-base font-bold text-amber-200">{timeLeft.days}</span>
                  <span className="block text-[9px] text-amber-400/70 uppercase">Days</span>
                </div>
                <div className="bg-[#1c0803] p-1.5 rounded-lg border border-amber-500/30">
                  <span className="block text-base font-bold text-amber-200">{timeLeft.hours}</span>
                  <span className="block text-[9px] text-amber-400/70 uppercase">Hrs</span>
                </div>
                <div className="bg-[#1c0803] p-1.5 rounded-lg border border-amber-500/30">
                  <span className="block text-base font-bold text-amber-200">{timeLeft.minutes}</span>
                  <span className="block text-[9px] text-amber-400/70 uppercase">Mins</span>
                </div>
                <div className="bg-[#1c0803] p-1.5 rounded-lg border border-amber-500/30">
                  <span className="block text-base font-bold text-amber-400 animate-pulse">{timeLeft.seconds}</span>
                  <span className="block text-[9px] text-amber-400/70 uppercase">Secs</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Feature Shortcut Cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div 
            onClick={() => setActiveTab('donors')}
            className="temple-card p-4 rounded-2xl cursor-pointer hover:border-amber-400/60 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                <Heart className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-100 group-hover:text-amber-300">Live Donors List</h4>
                <p className="text-xs text-amber-300/70">Check all contributions & transparent ledger</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400/60 group-hover:translate-x-1 transition-transform" />
          </div>

          <div 
            onClick={() => setActiveTab('events')}
            className="temple-card p-4 rounded-2xl cursor-pointer hover:border-amber-400/60 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-saffron-500/10 text-saffron-400 border border-saffron-500/30 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 text-saffron-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-100 group-hover:text-amber-300">4-Day Events Schedule</h4>
                <p className="text-xs text-amber-300/70">Annadanam, Vutti, Laddu Auction & Nimajjanam</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400/60 group-hover:translate-x-1 transition-transform" />
          </div>

          <div 
            onClick={() => setActiveTab('chat')}
            className="temple-card p-4 rounded-2xl cursor-pointer hover:border-amber-400/60 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-crimson-500/10 text-crimson-400 border border-crimson-500/30 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5 text-crimson-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-100 group-hover:text-amber-300">Youth Chat Box</h4>
                <p className="text-xs text-amber-300/70">Live voice notes, photos & discussions</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400/60 group-hover:translate-x-1 transition-transform" />
          </div>

        </div>

      </div>

    </div>
  );
};
