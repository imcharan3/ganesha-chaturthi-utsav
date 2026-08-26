import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Sparkles, Flame, Plus, RotateCcw, CheckCircle, 
  Crown, Share2, Download, Volume2, Users, AlertCircle, ArrowUpRight,
  Shield, Play, Pause, RefreshCw, UserPlus, Trash2, X, FileText, Edit2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { playTempleBell } from '../utils/audio';
import { generateAuctionPoster, downloadAuctionPoster, shareAuctionPoster } from '../utils/generateAuctionPoster';
import { generateAuctionPdf } from '../utils/generateAuctionPdf';
import { enqueueOfflineAction } from '../utils/offlineStorage';

export const LadduAuction = ({ onOpenDonation }) => {
  const { isAdmin, adminToken, setIsAdminModalOpen } = useAuth();
  const { socket } = useSocket();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBidder, setSelectedBidder] = useState(null);
  const [customBidderName, setCustomBidderName] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [liveBidAlert, setLiveBidAlert] = useState(null);
  const [showAddBidderModal, setShowAddBidderModal] = useState(false);
  const [showEditBidderModal, setShowEditBidderModal] = useState(false);
  const [editingBidder, setEditingBidder] = useState(null);
  const [editBidderForm, setEditBidderForm] = useState({ name: '', phone: '' });
  const [showDeclareWinnerModal, setShowDeclareWinnerModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupForm, setSetupForm] = useState({
    startingBid: 5001,
    ladduWeight: '21 KG',
    minIncrement: 0,
    itemTitle: 'శ్రీ వినాయక మహా లడ్డూ ప్రసాదం'
  });
  const [newBidderForm, setNewBidderForm] = useState({ name: '', phone: '' });
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [settings, setSettings] = useState(null);

  // Fetch initial auction data & settings
  const fetchAuctionData = async () => {
    try {
      const [auctionData, settingsData] = await Promise.all([
        api.getAuction(),
        api.getSettings()
      ]);
      setAuction(auctionData);
      setSettings(settingsData);
      if (auctionData) {
        setSetupForm({
          startingBid: auctionData.startingBid || 5001,
          ladduWeight: auctionData.ladduWeight || '21 KG',
          minIncrement: auctionData.minIncrement || 0,
          itemTitle: auctionData.itemTitle || 'శ్రీ వినాయక మహా లడ్డూ ప్రసాదం'
        });
        const nextStep = (Number(auctionData.currentHighestBid) || 5001) + (Number(auctionData.minIncrement) || 50);
        setBidAmount(nextStep.toString());
      }
    } catch (err) {
      console.error('Failed to load auction data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctionData();
  }, []);

  // Listen for real-time WebSocket events
  useEffect(() => {
    if (!socket) return;

    const handleAuctionUpdated = (updatedAuction) => {
      setAuction(updatedAuction);
      if (updatedAuction) {
        setSetupForm({
          startingBid: updatedAuction.startingBid || 5001,
          ladduWeight: updatedAuction.ladduWeight || '21 KG',
          minIncrement: updatedAuction.minIncrement || 0,
          itemTitle: updatedAuction.itemTitle || 'శ్రీ వినాయక మహా లడ్డూ ప్రసాదం'
        });
        const nextStep = (Number(updatedAuction.currentHighestBid) || 5001) + (Number(updatedAuction.minIncrement) || 50);
        setBidAmount(nextStep.toString());
      }
    };

    const handleNewBid = ({ newBid, auction: updatedAuction, notification }) => {
      setAuction(updatedAuction);
      playTempleBell();

      if (newBid) {
        setLiveBidAlert({
          bidderName: newBid.bidderName,
          amount: newBid.amount
        });
        setTimeout(() => setLiveBidAlert(null), 6000);

        // System / Browser Notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('🏆 Live Laddu Auction - New Bid!', {
              body: `${newBid.bidderName} placed ₹${Number(newBid.amount).toLocaleString('en-IN')} on Maha Laddu!`,
              icon: '/colony_logo.jpg'
            });
          } catch (e) {}
        }
      }

      if (updatedAuction) {
        const nextStep = (Number(updatedAuction.currentHighestBid) || 5001) + (Number(updatedAuction.minIncrement) || 50);
        setBidAmount(nextStep.toString());
      }
    };

    const handleWinnerDeclared = (updatedAuction) => {
      setAuction(updatedAuction);
      // Trigger celebration confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      playTempleBell();
    };

    socket.on('auction:updated', handleAuctionUpdated);
    socket.on('auction:newBid', handleNewBid);
    socket.on('auction:winnerDeclared', handleWinnerDeclared);

    return () => {
      socket.off('auction:updated', handleAuctionUpdated);
      socket.off('auction:newBid', handleNewBid);
      socket.off('auction:winnerDeclared', handleWinnerDeclared);
    };
  }, [socket]);

  // Admin Actions
  const handleUpdateStatus = async (status) => {
    try {
      const res = await api.updateAuctionStatus({ status }, adminToken);
      setAuction(res.auction);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleSaveSetup = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateAuctionStatus({
        startingBid: Number(setupForm.startingBid),
        ladduWeight: setupForm.ladduWeight.trim(),
        minIncrement: Number(setupForm.minIncrement) || 0,
        itemTitle: setupForm.itemTitle.trim()
      }, adminToken);
      setAuction(res.auction);
      setShowSetupModal(false);
    } catch (err) {
      alert(err.message || 'Failed to save setup');
    }
  };

  const handlePlaceBid = async (e) => {
    if (e) e.preventDefault();
    const bidderName = selectedBidder ? selectedBidder.name : customBidderName.trim();
    const numAmount = Number(bidAmount);

    if (!bidderName) {
      alert('Please select or enter a bidder name');
      return;
    }

    if (isNaN(numAmount) || numAmount <= (auction?.currentHighestBid || 0)) {
      alert(`Bid amount must be greater than current highest bid (₹${auction?.currentHighestBid})`);
      return;
    }

    setIsPlacingBid(true);
    try {
      if (!navigator.onLine) {
        enqueueOfflineAction('PLACE_BID', {
          itemId: 'main-laddu',
          bidData: { bidderName, amount: numAmount }
        });
        setAuction(prev => ({
          ...prev,
          currentHighestBid: numAmount,
          highestBidder: bidderName,
          bidHistory: [{ bidderName, amount: numAmount, timestamp: new Date().toISOString() }, ...(prev?.bidHistory || [])]
        }));
        playTempleBell();
      } else {
        try {
          const res = await api.placeAuctionBid({
            bidderName,
            amount: numAmount
          }, adminToken);
          setAuction(res.auction);
          playTempleBell();
        } catch (apiErr) {
          enqueueOfflineAction('PLACE_BID', {
            itemId: 'main-laddu',
            bidData: { bidderName, amount: numAmount }
          });
          setAuction(prev => ({
            ...prev,
            currentHighestBid: numAmount,
            highestBidder: bidderName,
            bidHistory: [{ bidderName, amount: numAmount, timestamp: new Date().toISOString() }, ...(prev?.bidHistory || [])]
          }));
          playTempleBell();
        }
      }

      // Clear custom fields if typed
      if (!selectedBidder) {
        setCustomBidderName('');
      }
    } catch (err) {
      alert(err.message || 'Failed to place bid');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handleQuickIncrement = (inc) => {
    const current = Number(auction?.currentHighestBid) || 5001;
    setBidAmount((current + inc).toString());
  };

  const handleUndoBid = async () => {
    if (!window.confirm('Are you sure you want to undo the last recorded bid?')) return;
    try {
      const res = await api.undoAuctionBid(adminToken);
      setAuction(res.auction);
    } catch (err) {
      alert(err.message || 'Failed to undo bid');
    }
  };

  const handleAddNewBidder = async (e) => {
    e.preventDefault();
    if (!newBidderForm.name.trim()) return;
    try {
      const res = await api.addAuctionBidder({ name: newBidderForm.name.trim(), phone: (newBidderForm.phone || '').trim() }, adminToken);
      setAuction(res.auction);
      setSelectedBidder(res.bidder);
      setShowAddBidderModal(false);
      setNewBidderForm({ name: '', phone: '' });
    } catch (err) {
      alert(err.message || 'Failed to add bidder');
    }
  };

  const handleOpenEditBidder = (bidder) => {
    setEditingBidder(bidder);
    setEditBidderForm({
      name: bidder.name || '',
      phone: bidder.phone || ''
    });
    setShowEditBidderModal(true);
  };

  const handleSaveEditBidder = async (e) => {
    e.preventDefault();
    if (!editingBidder || !editBidderForm.name.trim()) return;
    try {
      const res = await api.updateAuctionBidder(editingBidder.id, { name: editBidderForm.name.trim(), phone: (editBidderForm.phone || '').trim() }, adminToken);
      setAuction(res.auction);
      if (selectedBidder?.id === editingBidder.id) {
        setSelectedBidder(res.bidder);
      }
      setShowEditBidderModal(false);
      setEditingBidder(null);
    } catch (err) {
      alert(err.message || 'Failed to update bidder');
    }
  };

  const handleDeleteBidder = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Remove this bidder from quick list?')) return;
    try {
      const res = await api.deleteAuctionBidder(id, adminToken);
      setAuction(res.auction);
      if (selectedBidder?.id === id) setSelectedBidder(null);
    } catch (err) {
      alert(err.message || 'Failed to remove bidder');
    }
  };

  const handleDeclareWinner = async () => {
    const winnerName = auction?.highestBidderName;
    const winningBid = auction?.currentHighestBid;
    const ladduWeight = auction?.ladduWeight || '21 KG';

    if (!winnerName || !winningBid) {
      alert('No bids placed yet to declare a winner');
      return;
    }

    if (!window.confirm(`Declare "${winnerName}" as Grand Winner for ₹${winningBid.toLocaleString('en-IN')}?`)) return;

    try {
      const res = await api.declareAuctionWinner({
        winnerName,
        winningBid,
        ladduWeight
      }, adminToken);
      setAuction(res.auction);
      setShowDeclareWinnerModal(false);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 }
      });
    } catch (err) {
      alert(err.message || 'Failed to declare winner');
    }
  };

  const handleResetAuction = async () => {
    const startVal = prompt('Enter starting bid amount for reset (Default: 5001):', '5001');
    if (startVal === null) return;
    try {
      const res = await api.resetAuction(Number(startVal) || 5001, adminToken);
      setAuction(res.auction);
    } catch (err) {
      alert(err.message || 'Failed to reset auction');
    }
  };

  // Poster & PDF handlers
  const handleDownloadPoster = async () => {
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

  const handleSharePoster = async () => {
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

  const handleDownloadAuctionPdf = async () => {
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

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-amber-300">ప్రత్యక్ష లడ్డూ వేలం లోడ్ అవుతోంది... (Loading Live Auction)</p>
      </div>
    );
  }

  const isLive = auction?.status === 'live';
  const isCompleted = auction?.status === 'completed';
  const isUpcoming = !isLive && !isCompleted;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 relative">
      
      {/* Live Bid Alert Floating Toast Notification */}
      {liveBidAlert && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce max-w-sm sm:max-w-md w-full px-4">
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 p-3 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-950/20 flex items-center justify-center text-xl shrink-0">
              🏆
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider block text-amber-950/80">New Live Highest Bid!</span>
              <p className="font-extrabold text-sm truncate">
                <strong>{liveBidAlert.bidderName}</strong> placed <span className="font-mono text-base font-black">₹{Number(liveBidAlert.amount).toLocaleString('en-IN')}</span>
              </p>
            </div>
            <button onClick={() => setLiveBidAlert(null)} className="p-1 text-amber-950/70 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Header Banner & Status Badge */}
      <div className="temple-card p-4 sm:p-6 rounded-3xl border border-amber-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        
        <div className="text-center md:text-left space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-xs font-bold text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Day 3 Grand Celebration • ప్రత్యక్ష వేలం పాట</span>
            </span>

            {/* Current Status Pill */}
            <span className={`text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 ${
              isLive 
                ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]' 
                : isCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              <Flame className="w-3.5 h-3.5" />
              <span>
                {isLive ? 'LIVE BIDDING ONGOING' : isCompleted ? 'AUCTION CONCLUDED' : 'UPCOMING LIVE AUCTION'}
              </span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold gold-gradient-text font-devotional tracking-tight">
            {auction?.itemTitle || 'శ్రీ వినాయక మహా లడ్డూ ప్రసాదం'}
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/80 max-w-2xl">
            {settings?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్'} • 4 రోజుల పూజలలో అత్యంత పవిత్రమైన మహా లడ్డూ ప్రసాదం ప్రత్యక్ష వేలం పాట.
          </p>
        </div>

        {/* Action Controls (Admin & Public) */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {isAdmin ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowSetupModal(true)}
                className="px-3 py-2 rounded-xl bg-[#240e06] hover:bg-[#34160b] border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                title="Edit starting bid & laddu specs"
              >
                <span>⚙️ Settings</span>
              </button>

              {/* Status Switchers */}
              {!isLive && !isCompleted && (
                <button
                  onClick={() => handleUpdateStatus('live')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Live Auction (ప్రారంభించండి)</span>
                </button>
              )}

              {isLive && (
                <>
                  <button
                    onClick={() => setShowDeclareWinnerModal(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Crown Winner (విజేతను ప్రకటించండి)</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('upcoming')}
                    className="px-3 py-2 rounded-xl bg-[#34160b] text-amber-300 text-xs font-semibold"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                </>
              )}

              {isCompleted && (
                <button
                  onClick={() => handleUpdateStatus('live')}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-open Bidding</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="text-xs text-amber-400/80 hover:text-amber-200 underline flex items-center gap-1 px-3 py-2 rounded-xl bg-black/30 border border-amber-500/20"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. COMPLETED STATE: Grand Winner Showcase Card */}
      {isCompleted && auction?.winner && (
        <div className="temple-card p-6 sm:p-8 rounded-3xl border-2 border-amber-400 shadow-[0_15px_40px_rgba(245,158,11,0.25)] relative overflow-hidden text-center space-y-5 animate-in zoom-in-95 duration-300">
          
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 font-black px-4 py-1 rounded-full text-xs sm:text-sm shadow-gold">
            <Crown className="w-4 h-4 fill-amber-950" />
            <span>మహా లడ్డూ ప్రసాదం వేలం విజేత • GRAND AUCTION WINNER</span>
            <Crown className="w-4 h-4 fill-amber-950" />
          </div>

          <div className="space-y-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-400 via-saffron-500 to-amber-600 p-1 mx-auto shadow-divine flex items-center justify-center">
              <div className="w-full h-full bg-[#180703] rounded-full flex items-center justify-center text-3xl sm:text-4xl font-black text-amber-300">
                👑
              </div>
            </div>
            
            <h3 className="text-2xl sm:text-4xl font-extrabold text-amber-50 font-devotional">
              {auction.winner.name}
            </h3>
            <p className="text-sm sm:text-base font-semibold text-amber-300">
              లడ్డూ బరువు: <strong className="text-amber-200">{auction.ladduWeight || '21 KG'}</strong>
            </p>
          </div>

          {/* Winning Bid Display Box */}
          <div className="max-w-md mx-auto bg-gradient-to-r from-amber-950/80 via-[#2f1309] to-amber-950/80 border-2 border-amber-400/60 rounded-2xl p-4 sm:p-5 shadow-xl">
            <span className="text-xs text-amber-300/80 block uppercase tracking-wider font-semibold">
              గెలుచుకున్న వేలం మొత్తం (Winning Bid)
            </span>
            <p className="text-3xl sm:text-5xl font-black gold-gradient-text font-mono mt-1">
              ₹{Number(auction.winner.winningBid).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-amber-400/80 mt-1 italic">
              "సర్వేజనాః సుఖినోభవంతు - సమస్త సన్మంగళాని భవంతు"
            </p>
          </div>

          {/* Download & WhatsApp Share Poster + PDF CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-2xl mx-auto">
            <button
              onClick={handleSharePoster}
              disabled={isGeneratingPoster}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>{isGeneratingPoster ? 'Generating...' : 'Share on WhatsApp'}</span>
            </button>

            <button
              onClick={handleDownloadPoster}
              disabled={isGeneratingPoster}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#2b1008] hover:bg-[#3d170b] border-2 border-amber-500/50 text-amber-200 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Image (PNG)</span>
            </button>

            <button
              onClick={handleDownloadAuctionPdf}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-amber-200" />
              <span>Download PDF Report</span>
            </button>
          </div>

        </div>
      )}

      {/* 3. LIVE & UPCOMING: Current Highest Bid Spotlight & Action Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 Cols): Current Bid Spotlight & Sacred Laddu Info */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="temple-card p-6 rounded-3xl border border-amber-500/40 space-y-5 shadow-xl relative overflow-hidden">
            
            {/* Live Status Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                  {isLive ? 'Current Highest Bid (ప్రస్తుత అత్యధిక బిడ్)' : 'Starting Bid Price (ప్రారంభ ధర)'}
                </span>
              </div>
              <span className="text-xs text-amber-400/70 font-semibold">
                Total Bids Placed: <strong className="text-amber-200">{auction?.bidsCount || 0}</strong>
              </span>
            </div>

            {/* Giant Live Highest Price Ticker */}
            <div className="bg-gradient-to-b from-[#190703] via-[#120502] to-[#190703] border-2 border-amber-500/50 rounded-3xl p-6 text-center shadow-inner relative">
              <div className="text-4xl sm:text-6xl font-black gold-gradient-text font-mono tracking-tight">
                ₹{Number(auction?.currentHighestBid || 5001).toLocaleString('en-IN')}
              </div>

              {auction?.highestBidderName ? (
                <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-0.5">
                  <span className="text-xs text-amber-400/80">Highest Bidder (అత్యధిక బిడ్డర్):</span>
                  <p className="text-lg sm:text-xl font-bold text-amber-100 flex items-center justify-center gap-1.5">
                    <span>👑 {auction.highestBidderName}</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-amber-400/60 mt-2">
                  No bids recorded yet. Starting price: ₹{Number(auction?.startingBid || 5001).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Laddu Specs & Rules */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-center">
              <div className="bg-black/30 p-2.5 rounded-xl border border-amber-500/20">
                <span className="text-[10px] text-amber-400/70 block">Prasadam Weight</span>
                <strong className="text-amber-200 font-bold">{auction?.ladduWeight || '21 KG'} Pure Ghee</strong>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-amber-500/20">
                <span className="text-[10px] text-amber-400/70 block">Min Increment</span>
                <strong className="text-amber-200 font-bold">
                  {Number(auction?.minIncrement) > 0 ? `₹${auction.minIncrement}` : 'None (ఎంతైనా బిడ్ చేయవచ్చు)'}
                </strong>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-amber-500/20 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-amber-400/70 block">Bidding Mode</span>
                <strong className="text-amber-300 font-bold">Admin Verified</strong>
              </div>
            </div>

          </div>

          {/* Live Bids History Ledger */}
          <div className="temple-card p-5 rounded-3xl border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>వేలం చరిత్ర • Live Bids Timeline</span>
              </h3>
              
              <button
                onClick={handleDownloadAuctionPdf}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1 transition-all"
                title="Download PDF Report"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Download PDF</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {!auction?.bidsHistory || auction.bidsHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-amber-400/60">
                  వేలం ప్రారంభమైన తర్వాత బిడ్ల వివరాలు ఇక్కడ ప్రత్యక్షంగా కనిపిస్తాయి.
                </div>
              ) : (
                auction.bidsHistory.map((bid, idx) => (
                  <div
                    key={bid.id || idx}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                      idx === 0
                        ? 'bg-amber-500/15 border-amber-400/60 text-amber-100 shadow-sm'
                        : 'bg-black/30 border-amber-500/15 text-amber-300/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                        #{auction.bidsHistory.length - idx}
                      </span>
                      <div>
                        <strong className="text-amber-100 text-xs sm:text-sm block">{bid.bidderName}</strong>
                        <span className="text-[10px] text-amber-400/70">{new Date(bid.timestamp).toLocaleTimeString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-sm sm:text-base text-amber-300">
                        ₹{Number(bid.amount).toLocaleString('en-IN')}
                      </span>
                      {idx === 0 && (
                        <span className="block text-[9px] font-bold text-emerald-400 uppercase">
                          Highest Bid ⭐
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column (5 Cols): Admin Bidding Console OR Devotee Live Viewer Info */}
        <div className="lg:col-span-5 space-y-6">
          
          {isAdmin ? (
            /* ADMIN BIDDING CONSOLE */
            <div className="temple-card p-5 sm:p-6 rounded-3xl border-2 border-amber-400/60 shadow-2xl space-y-4 relative">
              
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-amber-200">అడ్మిన్ బిడ్డింగ్ కంట్రోల్ (Admin Console)</h3>
                </div>
                {auction?.bidsHistory?.length > 0 && (
                  <button
                    onClick={handleUndoBid}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-500/30"
                    title="Undo last recorded bid"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Undo Last</span>
                  </button>
                )}
              </div>

              <form onSubmit={handlePlaceBid} className="space-y-4 text-xs">
                
                {/* 1. Quick Select Registered Bidders & Management */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-amber-300 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Select Participating Bidder (బిడ్డర్ ఎంచుకోండి):</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedBidder) {
                            handleOpenEditBidder(selectedBidder);
                          } else if (auction?.registeredBidders?.length > 0) {
                            handleOpenEditBidder(auction.registeredBidders[0]);
                          } else {
                            alert('Please add a bidder first or select one to edit');
                          }
                        }}
                        className="text-[11px] font-bold text-amber-300 hover:text-white bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1"
                        title="Edit member details"
                      >
                        <Edit2 className="w-3 h-3 text-amber-400" />
                        <span>✏️ Edit Member</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddBidderModal(true)}
                        className="text-[11px] font-bold text-amber-300 hover:text-white bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3 text-amber-400" />
                        <span>+ Add New</span>
                      </button>
                    </div>
                  </div>

                  {/* Bidders Chips List with 1-click edit and delete */}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1.5 bg-[#140502] rounded-xl border border-amber-500/30">
                    {auction?.registeredBidders && auction.registeredBidders.length > 0 ? (
                      auction.registeredBidders.map((bidder) => {
                        const isSelected = selectedBidder?.id === bidder.id;
                        return (
                          <div
                            key={bidder.id}
                            onClick={() => {
                              setSelectedBidder(isSelected ? null : bidder);
                              setCustomBidderName('');
                            }}
                            className={`group cursor-pointer px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 border-amber-300 shadow-gold scale-105'
                                : 'bg-[#240e06] text-amber-200 border-amber-500/30 hover:border-amber-400'
                            }`}
                          >
                            <span>👤 {bidder.name}</span>
                            
                            {/* Inline Edit Icon */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditBidder(bidder);
                              }}
                              className="text-amber-400 hover:text-white opacity-0 group-hover:opacity-100 ml-1 p-0.5"
                              title="Edit this member"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            {/* Inline Delete Icon */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteBidder(bidder.id, e)}
                              className="text-red-400 hover:text-red-200 opacity-0 group-hover:opacity-100 p-0.5"
                              title="Delete from list"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[11px] text-amber-400/60 p-1">No bidders in quick list. Click "+ Add New" or type below.</p>
                    )}
                  </div>
                </div>

                {/* 2. Or Type Custom Bidder Name */}
                {!selectedBidder && (
                  <div className="bg-[#170702] p-2.5 rounded-xl border border-amber-500/30">
                    <label className="block text-amber-300/80 mb-0.5 text-[11px]">Or Type New Bidder Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. రమేష్ కుమార్"
                      value={customBidderName}
                      onChange={(e) => setCustomBidderName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#240e06] border border-amber-500/40 text-amber-100 text-xs focus:outline-none"
                    />
                  </div>
                )}

                {/* 3. Bid Increment Quick Buttons: 50, 100, 116, 200, 500, 1000 */}
                <div className="space-y-1.5">
                  <label className="font-bold text-amber-300 block text-[11px]">Quick Increments (త్వరిత పెరుగుదల):</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {[50, 100, 116, 200, 500, 1000].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => handleQuickIncrement(inc)}
                        className="py-1.5 rounded-lg bg-[#280e06] hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all active:scale-95 text-center"
                      >
                        +₹{inc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Exact Bid Amount Input */}
                <div>
                  <label className="block font-bold text-amber-300 mb-1">Enter Bid Amount (బిడ్ మొత్తం ₹):</label>
                  <input
                    type="number"
                    required
                    min={Number(auction?.currentHighestBid || 5001) + 1}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#140502] border-2 border-amber-400 text-amber-100 text-base font-mono font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-amber-400/60 block mt-0.5">
                    Must be &gt; ₹{Number(auction?.currentHighestBid || 5001).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Submit Bid Button */}
                <button
                  type="submit"
                  disabled={isPlacingBid}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-600 text-amber-950 font-black text-sm shadow-gold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{isPlacingBid ? 'Recording Bid...' : `Record Bid (₹${Number(bidAmount || 0).toLocaleString('en-IN')})`}</span>
                </button>

              </form>

            </div>
          ) : (
            /* DEVOTEE LIVE VIEWER CARD */
            <div className="temple-card p-6 rounded-3xl border border-amber-500/30 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 mx-auto flex items-center justify-center text-xl font-bold">
                🕉️
              </div>
              <h3 className="font-devotional text-lg font-bold gold-gradient-text">
                ప్రత్యక్ష లడ్డూ వేలం పాట నియమాలు
              </h3>
              <ul className="text-xs text-amber-200/80 space-y-2 text-left bg-black/30 p-3.5 rounded-2xl border border-amber-500/20">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">1.</span>
                  <span>ప్రారంభ వేలం పాట ధర <strong>₹{Number(auction?.startingBid || 5001).toLocaleString('en-IN')}</strong> ({auction?.ladduWeight || '21 KG'} లడ్డూ ప్రసాదం).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">2.</span>
                  <span>కమిటీ అడ్మిన్ ద్వారా మాత్రమే ప్రత్యక్షంగా బిడ్లు నమోదు చేయబడతాయి.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">3.</span>
                  <span>అత్యధిక బిడ్ వేసిన భక్తుడికి విజయ కాలనీ గణేష్ యూత్ తరపున మహా లడ్డూ ప్రసాదం బహూకరించబడుతుంది.</span>
                </li>
              </ul>
              <p className="text-[11px] text-amber-400/60">
                వేలంలో పాల్గొనాలనుకునే భక్తులు మండపం వద్ద కమిటీ సభ్యులను సంప్రదించగలరు.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* MODAL 0: Admin Auction Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#240e06] border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
              <h3 className="font-devotional text-base font-bold gold-gradient-text flex items-center gap-1.5">
                <span>⚙️ వేలం సెట్టింగ్స్ • Auction Setup</span>
              </h3>
              <button onClick={() => setShowSetupModal(false)} className="p-1 text-amber-300/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSetup} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Starting Auction Value (ప్రారంభ వేలం ధర ₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={setupForm.startingBid}
                  onChange={(e) => setSetupForm({ ...setupForm, startingBid: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#140502] border border-amber-500/40 text-amber-100 font-mono font-bold text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Weight of Laddu (లడ్డూ బరువు)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 21 KG, 15 KG, 11 KG, 5 KG"
                    value={setupForm.ladduWeight}
                    onChange={(e) => setSetupForm({ ...setupForm, ladduWeight: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#140502] border border-amber-500/40 text-amber-100 focus:outline-none font-semibold"
                  />
                  {['21 KG', '15 KG', '11 KG', '5 KG'].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSetupForm({ ...setupForm, ladduWeight: w })}
                      className="px-2 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Minimum Increment (కనిష్ట పెరుగుదల ₹ - 0 for None)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for none"
                    value={setupForm.minIncrement}
                    onChange={(e) => setSetupForm({ ...setupForm, minIncrement: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#140502] border border-amber-500/40 text-amber-100 font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSetupForm({ ...setupForm, minIncrement: 0 })}
                    className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border ${
                      Number(setupForm.minIncrement) === 0 
                        ? 'bg-emerald-600 text-white border-emerald-400' 
                        : 'bg-black/40 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    None (0)
                  </button>
                </div>
                <span className="text-[10px] text-amber-400/70 block mt-0.5">
                  Set to 0 if there is no minimum increment constraint.
                </span>
              </div>

              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Item Title (శీర్షిక)</label>
                <input
                  type="text"
                  value={setupForm.itemTitle}
                  onChange={(e) => setSetupForm({ ...setupForm, itemTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#140502] border border-amber-500/40 text-amber-100 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#34160b] text-amber-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold shadow-gold"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: Add New Bidder to Quick List (Admin Only) */}
      {showAddBidderModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#240e06] border-2 border-amber-500/60 rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="font-devotional text-base font-bold gold-gradient-text flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Add Bidder to Quick List</span>
            </h3>

            <form onSubmit={handleAddNewBidder} className="space-y-3 text-xs">
              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Bidder Full Name (పేరు)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. శ్రీ రాముని అంజి రావు"
                  value={newBidderForm.name}
                  onChange={(e) => setNewBidderForm({ ...newBidderForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#140502] border border-amber-500/40 text-amber-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. 98480 12345"
                  value={newBidderForm.phone || ''}
                  onChange={(e) => setNewBidderForm({ ...newBidderForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#140502] border border-amber-500/40 text-amber-100 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBidderModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#34160b] text-amber-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold shadow-gold"
                >
                  Save Bidder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1.5: Edit Member Details Modal (Admin Only) */}
      {showEditBidderModal && editingBidder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#240e06] border-2 border-amber-500/60 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
              <h3 className="font-devotional text-base font-bold gold-gradient-text flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Bidder Member (సభ్యుని వివరాలు సవరించండి)</span>
              </h3>
              <button onClick={() => setShowEditBidderModal(false)} className="p-1 text-amber-300/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBidder} className="space-y-3 text-xs">
              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Bidder Full Name (పేరు)</label>
                <input
                  type="text"
                  required
                  value={editBidderForm.name}
                  onChange={(e) => setEditBidderForm({ ...editBidderForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#140502] border border-amber-500/40 text-amber-100 font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Phone (Optional)</label>
                <input
                  type="text"
                  value={editBidderForm.phone}
                  onChange={(e) => setEditBidderForm({ ...editBidderForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#140502] border border-amber-500/40 text-amber-100 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditBidderModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#34160b] text-amber-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold shadow-gold"
                >
                  Update Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Finalize Winner Confirmation (Admin Only) */}
      {showDeclareWinnerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#240e06] border-2 border-amber-400 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-300 border-2 border-amber-400 mx-auto flex items-center justify-center text-2xl shadow-gold">
              👑
            </div>
            <h3 className="font-devotional text-xl font-bold gold-gradient-text">
              మహా లడ్డూ ప్రసాదం వేలం విజేతను ప్రకటించండి
            </h3>
            <p className="text-xs text-amber-200/80">
              Are you sure you want to conclude the live auction and crown the winner?
            </p>

            <div className="bg-[#170702] p-4 rounded-2xl border border-amber-500/30 text-xs space-y-1">
              <span className="text-amber-400/70 block">Highest Bidder Name:</span>
              <strong className="text-lg text-amber-100 font-bold block">{auction?.highestBidderName || 'No Bidder'}</strong>
              <span className="text-amber-400/70 block pt-1">Winning Amount:</span>
              <strong className="text-2xl gold-gradient-text font-mono block">
                ₹{Number(auction?.currentHighestBid || 5001).toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="flex gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowDeclareWinnerModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#34160b] text-amber-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclareWinner}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-black shadow-gold hover:brightness-110"
              >
                Crown Winner 🎉
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
