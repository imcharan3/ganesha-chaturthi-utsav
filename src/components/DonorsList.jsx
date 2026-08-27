import React, { useState, useMemo } from 'react';
import { 
  Heart, Search, Filter, ArrowUpDown, Trash2, Edit3, Shield, Download, 
  Plus, CheckCircle, Sparkles, Trophy, UserCheck, Eye, Image as ImageIcon, 
  ExternalLink, X, Upload, Receipt, Share2, FileText, Phone, CheckCircle2, Star 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { playTempleBell, compressImageToBase64 } from '../utils/audio';
import { ReceiptsArchiveModal } from './ReceiptsArchiveModal';
import { 
  downloadDonorReceiptPdf, 
  downloadDonorReceiptPng, 
  sendWhatsAppReceipt, 
  downloadDonorsLedgerPdf 
} from '../utils/receiptGenerator';

export const DonorsList = ({ donors = [], stats, settings, onOpenDonation, onRefreshDonors }) => {
  const { isAdmin, adminToken, setIsAdminModalOpen } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'highest' | 'lowest' | 'special'
  const [filterTier, setFilterTier] = useState('all'); // 'all' | 'special' | 'maha' | 'above1000' | 'below1000'
  
  // Public Screenshot Lightbox Modal State
  const [selectedReceiptDonor, setSelectedReceiptDonor] = useState(null);

  // Bills & Receipts Archive Modal State
  const [isReceiptsArchiveOpen, setIsReceiptsArchiveOpen] = useState(false);

  // Verification Success Prompt State (Instant WhatsApp delivery for Admin)
  const [verifySuccessDonor, setVerifySuccessDonor] = useState(null);

  // Edit State for Admin
  const [editingDonor, setEditingDonor] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    amount: '',
    message: '',
    status: 'Verified',
    receiptUrl: '',
    isSpecialDonor: false,
    specialContribution: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isDownloadingPdfList, setIsDownloadingPdfList] = useState(false);

  // Verified Donors Count for badge
  const verifiedCount = useMemo(() => {
    return donors.filter(d => d.status === 'Verified' || d.receiptNo).length;
  }, [donors]);

  // Filtered & Sorted Donors
  const filteredDonors = useMemo(() => {
    return (donors || [])
      .filter((d) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = 
          !query ||
          d.name?.toLowerCase().includes(query) ||
          d.receiptNo?.toLowerCase().includes(query) ||
          d.phone?.includes(query) ||
          d.referenceNo?.toLowerCase().includes(query) ||
          d.specialContribution?.toLowerCase().includes(query) ||
          d.message?.toLowerCase().includes(query);

        if (!matchesSearch) return false;

        const amt = Number(d.amount) || 0;
        if (filterTier === 'special') return d.isSpecialDonor;
        if (filterTier === 'maha') return amt >= 5000;
        if (filterTier === 'above1000') return amt >= 1000;
        if (filterTier === 'below1000') return amt < 1000;
        return true;
      })
      .sort((a, b) => {
        // If sorting by special first
        if (sortBy === 'special') {
          if (a.isSpecialDonor && !b.isSpecialDonor) return -1;
          if (!a.isSpecialDonor && b.isSpecialDonor) return 1;
        }
        if (sortBy === 'highest') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
        if (sortBy === 'lowest') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
        // Default newest
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [donors, searchQuery, sortBy, filterTier]);

  // Identify Top Donors (exclude sample records)
  const topDonors = useMemo(() => {
    return [...(donors || [])]
      .filter(d => !d.isSample)
      .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
      .slice(0, 3);
  }, [donors]);

  // Admin 1-Click Verify Donor
  const handleVerifyDonor = async (id, name) => {
    try {
      const res = await api.verifyDonor(id, adminToken);
      const updated = res.donor || res;
      if (selectedReceiptDonor?.id === id) {
        setSelectedReceiptDonor(prev => ({ ...prev, status: 'Verified', ...updated }));
      }
      if (onRefreshDonors) onRefreshDonors();
      if (updated) {
        setVerifySuccessDonor(updated);
      }
    } catch (err) {
      alert(err.message || 'Failed to verify donor');
    }
  };

  // Admin Delete Donor
  const handleDeleteDonor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete donor "${name}" from the ledger?`)) return;
    try {
      await api.deleteDonor(id, adminToken);
      if (onRefreshDonors) onRefreshDonors();
      if (selectedReceiptDonor?.id === id) setSelectedReceiptDonor(null);
    } catch (err) {
      alert(err.message || 'Failed to delete donor');
    }
  };

  // Admin Edit Donor
  const handleOpenEdit = (donor) => {
    setEditingDonor(donor);
    setEditForm({
      name: donor.name || '',
      phone: donor.phone || '',
      amount: donor.amount || '',
      message: donor.message || '',
      status: donor.status || 'Verified',
      receiptUrl: donor.receiptUrl || '',
      isSpecialDonor: Boolean(donor.isSpecialDonor),
      specialContribution: donor.specialContribution || ''
    });
  };

  const handleAdminReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingReceipt(true);
    try {
      const dataUrl = await compressImageToBase64(file);
      setEditForm(prev => ({ ...prev, receiptUrl: dataUrl }));
    } catch (err) {
      alert(err.message || 'Failed to process screenshot image');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleQuickUploadScreenshot = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedReceiptDonor) return;
    setIsUploadingReceipt(true);
    try {
      const dataUrl = await compressImageToBase64(file);
      await api.updateDonor(selectedReceiptDonor.id, {
        ...selectedReceiptDonor,
        receiptUrl: dataUrl
      }, adminToken);
      setSelectedReceiptDonor(prev => ({ ...prev, receiptUrl: dataUrl }));
      if (onRefreshDonors) onRefreshDonors();
      alert('✅ Screenshot proof attached & saved permanently to MongoDB database!');
    } catch (err) {
      alert(err.message || 'Failed to update screenshot');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.updateDonor(editingDonor.id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        amount: Number(editForm.amount),
        message: editForm.message.trim(),
        status: editForm.status,
        receiptUrl: editForm.receiptUrl || null,
        isSpecialDonor: editForm.status === 'Verified' ? Boolean(editForm.isSpecialDonor) : false,
        specialContribution: editForm.status === 'Verified' && editForm.isSpecialDonor ? editForm.specialContribution.trim() : ''
      }, adminToken);
      setEditingDonor(null);
      if (selectedReceiptDonor?.id === editingDonor.id) {
        setSelectedReceiptDonor(prev => ({ ...prev, ...editForm }));
      }
      if (onRefreshDonors) onRefreshDonors();
    } catch (err) {
      alert(err.message || 'Failed to update donor');
    } finally {
      setIsUpdating(false);
    }
  };

  // Download PDF Donors List (Verified Donors Only, Special Donors on Top, Clickable Links)
  const handleDownloadPdfList = () => {
    setIsDownloadingPdfList(true);
    try {
      downloadDonorsLedgerPdf(donors, settings);
    } finally {
      setIsDownloadingPdfList(false);
    }
  };

  // Export Donors to CSV / Excel
  const handleExportCSV = () => {
    if (!donors || donors.length === 0) {
      alert('No donor records to export');
      return;
    }

    const headers = [
      'Receipt No (రశీదు నెం)',
      'Donor Name (దాత పేరు)',
      'Special Donor Status',
      'Special Contribution Note',
      'Mobile Phone (ఫోన్)',
      'Amount (₹)',
      'Payment Mode',
      'Reference / UTR No',
      'Verification Status',
      'Created Date & Time',
      'Verified Date & Time',
      'Devotional Message / Wishes',
      'Screenshot Receipt URL'
    ];

    const rows = donors.map(d => [
      d.receiptNo || 'N/A',
      `"${(d.name || '').replace(/"/g, '""')}"`,
      d.isSpecialDonor ? 'Special Donor (విశిష్ట దాత)' : 'Regular Donor',
      `"${(d.specialContribution || '').replace(/"/g, '""')}"`,
      `"${d.phone || ''}"`,
      Number(d.amount) || 0,
      `"${d.paymentMode || 'UPI'}"`,
      `"${d.referenceNo || ''}"`,
      `"${d.status || 'Pending Verification'}"`,
      `"${new Date(d.createdAt).toLocaleString('en-IN')}"`,
      `"${d.verifiedAt ? new Date(d.verifiedAt).toLocaleString('en-IN') : 'N/A'}"`,
      `"${(d.message || '').replace(/"/g, '""')}"`,
      `"${d.receiptUrl || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Vijaya_Colony_Ganesha_Donors_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="temple-card p-4 sm:p-6 rounded-3xl shadow-xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="text-center md:text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
            <Heart className="w-3.5 h-3.5 fill-saffron-500 text-saffron-500" />
            <span>పారదర్శక దాతల జాబితా • Transparent Ledger</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold gold-gradient-text font-devotional">
            శ్రీ వినాయక చవితి దాతల వివరాలు (Donors List)
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/80">
            మండపం మరియు అన్నదాన కార్యక్రమాలకు విరాళాలు సమర్పించిన గౌరవనీయ భక్తుల వివరాలు & అధికారిక రశీదులు.
          </p>
        </div>

        {/* Action CTAs Toolbar */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          
          {/* Download Official Donors PDF Report */}
          <button
            onClick={handleDownloadPdfList}
            disabled={isDownloadingPdfList}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-amber-950 font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            title="Download PDF of Verified Donors (Special Donors on Top with Clickable Screenshot Links)"
          >
            <FileText className="w-4 h-4 text-amber-950" />
            <span>Download Donors List (PDF)</span>
          </button>

          {/* Bills & Receipts Archive Button */}
          <button
            onClick={() => setIsReceiptsArchiveOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 hover:from-emerald-700 hover:to-teal-700 border border-emerald-400/40 text-emerald-100 font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            title="View All Verified Bills & Receipts Archive"
          >
            <Receipt className="w-4 h-4 text-emerald-300" />
            <span>Bills & Receipts ({verifiedCount})</span>
          </button>

          <button
            onClick={onOpenDonation}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-saffron-500 to-amber-500 text-amber-950 font-bold text-xs sm:text-sm shadow-gold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Donation (విరాళం)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-[#2b1008] hover:bg-[#3c170b] border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Download CSV for Committee Records"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>CSV</span>
          </button>

          {isAdmin ? (
            <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1.5 rounded-xl text-xs text-emerald-300 font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Active</span>
            </div>
          ) : (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="text-xs text-amber-400/80 hover:text-amber-200 underline flex items-center gap-1 px-2 py-1"
            >
              <Shield className="w-3 h-3" />
              <span>Admin Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 3 Maha Daata Spotlight Cards */}
      {topDonors.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>ముఖ్య దాతలు • Top Major Donors (Maha Daatas)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {topDonors.map((donor, idx) => {
              const rankColors = [
                'from-amber-500/25 via-yellow-500/10 to-amber-950/40 border-amber-400/60 text-amber-300',
                'from-slate-400/20 via-slate-500/10 to-amber-950/40 border-slate-400/50 text-slate-200',
                'from-amber-700/20 via-amber-800/10 to-amber-950/40 border-amber-700/50 text-amber-400'
              ];
              const rankBadges = ['🥇 1st Maha Daata', '🥈 2nd Maha Daata', '🥉 3rd Maha Daata'];

              return (
                <div
                  key={donor.id}
                  className={`bg-gradient-to-br ${rankColors[idx]} p-4 rounded-2xl border backdrop-blur-md relative overflow-hidden shadow-lg space-y-2`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/40 border border-amber-500/30">
                      {rankBadges[idx]}
                    </span>
                    <span className="text-lg font-extrabold gold-gradient-text">
                      ₹{Number(donor.amount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-base text-amber-100 line-clamp-1">{donor.name}</h4>
                      {donor.isSpecialDonor && donor.status === 'Verified' && (
                        <span className="shrink-0 p-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]" title="Special Donor">
                          ⭐
                        </span>
                      )}
                    </div>
                    {donor.phone && <p className="text-xs text-amber-300/80">Phone: +91 {donor.phone}</p>}
                  </div>

                  {donor.isSpecialDonor && donor.status === 'Verified' && donor.specialContribution && (
                    <div className="bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-lg text-[11px] text-amber-200">
                      <span className="text-amber-400 font-bold">🌟 విశిష్ట సేవ:</span> {donor.specialContribution}
                    </div>
                  )}

                  {donor.receiptNo && (
                    <span className="inline-block text-[10px] font-mono font-bold text-amber-300 bg-black/50 px-2 py-0.5 rounded border border-amber-500/30">
                      Receipt: {donor.receiptNo}
                    </span>
                  )}

                  {donor.message && (
                    <p className="text-xs italic text-amber-200/70 line-clamp-1">"{donor.message}"</p>
                  )}

                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    {/* Send WhatsApp Receipt (ADMIN ONLY) */}
                    {isAdmin && donor.status === 'Verified' && (
                      <button
                        type="button"
                        onClick={() => sendWhatsAppReceipt(donor, settings)}
                        className="py-1 px-2.5 rounded-lg bg-emerald-700/50 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-200 text-[11px] font-semibold flex items-center gap-1 transition-all"
                        title="Send Receipt to Donor WhatsApp (Admin Only)"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Send WhatsApp</span>
                      </button>
                    )}
                    {donor.receiptUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptDonor(donor)}
                        className="py-1 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Screenshot</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Donors Ledger Table / List Card */}
      <div className="temple-card p-4 sm:p-6 rounded-3xl shadow-xl space-y-4">
        
        {/* Controls & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Donor name, Receipt No, Phone, Special contribution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1c0803] border border-amber-500/30 text-amber-100 text-xs sm:text-sm focus:outline-none focus:border-amber-400 placeholder:text-amber-400/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#1c0803] border border-amber-500/30 text-amber-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none flex-1 md:flex-none"
            >
              <option value="newest">Newest First</option>
              <option value="special">Special Donors First ⭐</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>

            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="bg-[#1c0803] border border-amber-500/30 text-amber-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none flex-1 md:flex-none"
            >
              <option value="all">All Donors</option>
              <option value="special">🌟 Special Donors Only</option>
              <option value="maha">Maha Daatas (₹5000+)</option>
              <option value="above1000">₹1000 & Above</option>
              <option value="below1000">Below ₹1000</option>
            </select>
          </div>
        </div>

        {/* Donors List Items */}
        {filteredDonors.length === 0 ? (
          <div className="p-8 text-center bg-[#180702] rounded-2xl border border-amber-500/20 text-amber-300/60 space-y-2">
            <Heart className="w-10 h-10 mx-auto text-amber-500/30" />
            <p className="text-sm font-semibold">No donor records found matching your query.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDonors.map((donor) => {
              const isVerified = donor.status === 'Verified';
              const isSpecial = isVerified && donor.isSpecialDonor;
              const createdDateStr = new Date(donor.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
              });
              const verifiedDateStr = donor.verifiedAt ? new Date(donor.verifiedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              }) : null;

              return (
                <div
                  key={donor.id}
                  className={`p-4 rounded-2xl transition-all shadow-md border ${
                    isSpecial 
                      ? 'bg-gradient-to-r from-[#2c1206] via-[#240b04] to-[#1c0803] border-amber-400/60 shadow-amber-950/40' 
                      : 'bg-[#1c0803]/80 hover:bg-[#250b04] border-amber-500/30 hover:border-amber-500/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    
                    {/* Left: Donor Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      
                      {/* Name & Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-white font-devotional truncate">
                          {donor.name}
                        </h4>

                        {/* Special Donor Badge (Visible only after verification & admin assign) */}
                        {isSpecial && (
                          <span className="text-[10px] sm:text-[11px] bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 px-2 py-0.5 rounded-full font-black flex items-center gap-1 shadow-sm border border-amber-300">
                            <Star className="w-3 h-3 fill-amber-950" />
                            <span>విశిష్ట దాత (Special Donor)</span>
                          </span>
                        )}

                        {isVerified ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Verified ✅</span>
                            </span>
                            {donor.receiptNo && (
                              <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-500/30">
                                {donor.receiptNo}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleVerifyDonor(donor.id, donor.name)}
                                className="text-[10px] bg-amber-500 hover:bg-amber-400 text-amber-950 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                                title="Click to Verify and Issue Official Receipt"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Verify (ధృవీకరించండి) ✓</span>
                              </button>
                            ) : (
                              <span className="text-[10px] bg-amber-950/40 text-amber-400/70 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span>Pending Verification ⏳</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Special Contribution Note if applicable */}
                      {isSpecial && donor.specialContribution && (
                        <div className="inline-block bg-amber-950/70 border border-amber-500/30 px-2.5 py-0.5 rounded-lg text-xs text-amber-200">
                          <strong className="text-amber-400">🌟 విశిష్ట సేవ:</strong> {donor.specialContribution}
                        </div>
                      )}

                      {/* Meta: Phone, Mode, Timestamp */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-amber-300/70">
                        {donor.phone && <span>ఫోన్: <strong className="text-amber-200">+91 {donor.phone}</strong></span>}
                        <span>Mode: <strong className="text-amber-200">{donor.paymentMode || 'UPI'}</strong></span>
                        <span className="text-amber-400/50">•</span>
                        <span>Date: {createdDateStr}</span>
                        {verifiedDateStr && <span className="text-emerald-400/80">• Verified: {verifiedDateStr}</span>}
                      </div>

                      {donor.message && (
                        <p className="text-xs italic text-amber-200/80 pt-0.5">
                          "{donor.message}"
                        </p>
                      )}

                      {/* Receipt & Delivery Actions */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        
                        {/* Screenshot Lightbox Trigger */}
                        {donor.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptDonor(donor)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 hover:text-white text-xs font-semibold shadow-sm transition-all"
                            title="View uploaded payment screenshot"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>Payment Screenshot</span>
                          </button>
                        )}

                        {/* Verified Devotional Receipt Actions */}
                        {isVerified && (
                          <>
                            {/* Send WhatsApp Receipt (ADMIN ONLY) */}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => sendWhatsAppReceipt(donor, settings)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                                title="Send official receipt to donor WhatsApp (Admin Only)"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>{donor.phone ? 'Send WhatsApp Receipt 📱' : 'Share WhatsApp'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('open-receipt-preview-modal', {
                                  detail: { donor, settings }
                                }));
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                              title="రశీదు చూడండి, PDF డౌన్‌లోడ్ & WhatsApp షేర్ చేయండి"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-200" />
                              <span>రశీదు (View Receipt) 🪔</span>
                            </button>
                          </>
                        )}

                      </div>

                    </div>

                    {/* Right: Amount & Admin Controls */}
                    <div className="text-right flex flex-col items-end justify-between self-stretch shrink-0">
                      <p className="text-lg sm:text-xl font-extrabold gold-gradient-text font-mono">
                        ₹{Number(donor.amount).toLocaleString('en-IN')}
                      </p>

                      {/* Admin Controls */}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-amber-500/20">
                          {!isVerified && (
                            <button
                              onClick={() => handleVerifyDonor(donor.id, donor.name)}
                              className="px-2 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                              title="Verify Donor"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(donor)}
                            className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-amber-950 transition-all text-xs"
                            title="Edit Donor Details & Special Donor Status (Admin Only)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDonor(donor.id, donor.name)}
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-600 hover:text-white transition-all text-xs"
                            title="Delete Donor (Admin Only)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verification Success & Instant WhatsApp Send Modal (Admin Only) */}
      {verifySuccessDonor && isAdmin && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setVerifySuccessDonor(null)}
        >
          <div 
            className="relative w-full max-w-md bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#120502] border-2 border-emerald-500/60 rounded-3xl shadow-2xl p-6 text-center space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-emerald-300">
                విరాళం ధృవీకరించబడింది!
              </h3>
              <p className="text-xs text-amber-200/80">
                Payment verified successfully for <strong className="text-white">{verifySuccessDonor.name}</strong> (₹{Number(verifySuccessDonor.amount).toLocaleString('en-IN')}).
              </p>
              <div className="pt-1">
                <span className="text-xs font-mono font-bold text-amber-300 bg-black/50 px-3 py-1 rounded-full border border-amber-500/30">
                  Receipt No: {verifySuccessDonor.receiptNo || 'VCGD-REC'}
                </span>
              </div>
            </div>

            {verifySuccessDonor.phone ? (
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-2xl space-y-2">
                <p className="text-xs text-emerald-200">
                  📲 Send official receipt to donor on WhatsApp (+91 <strong>{verifySuccessDonor.phone}</strong>)?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    sendWhatsAppReceipt(verifySuccessDonor, settings);
                    setVerifySuccessDonor(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send WhatsApp Receipt Now 🚀</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-[#180702] border border-amber-500/20 rounded-2xl space-y-2 text-xs text-amber-300/80">
                <p>No phone number provided. You can download or share the bill manually.</p>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-receipt-preview-modal', {
                        detail: { donor: verifySuccessDonor, settings }
                      }));
                    }}
                    className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold shadow-sm"
                  >
                    View Official Receipt 🪔
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setVerifySuccessDonor(null)}
              className="text-xs text-amber-300/60 hover:text-amber-200 underline"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* Admin Edit Modal (with Special Donor Toggle & Special Contribution field) */}
      {editingDonor && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#120502] border-2 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col my-auto">
            
            <div className="bg-gradient-to-r from-crimson-900 via-saffron-800 to-crimson-900 p-3.5 text-center relative border-b border-amber-500/30 shrink-0">
              <button
                onClick={() => setEditingDonor(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-amber-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-devotional text-base font-bold gold-gradient-text">
                దాత వివరాల సవరణ | Edit Donor (Admin Only)
              </h3>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 sm:p-6 space-y-3.5 overflow-y-auto custom-scrollbar flex-1 text-xs">
              
              <div>
                <label className="block text-amber-300/80 mb-1">Donor Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-amber-300/80 mb-1">Mobile / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="10 digit number"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-amber-300/80 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-300/80 mb-1">Verification Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
                >
                  <option value="Verified">Verified ✅ (ధృవీకరించబడింది)</option>
                  <option value="Pending Verification">Pending Verification ⏳</option>
                </select>
              </div>

              {/* Special Donor Configuration Box (Admin Only) */}
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isSpecialDonor}
                      disabled={editForm.status !== 'Verified'}
                      onChange={(e) => setEditForm({ ...editForm, isSpecialDonor: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-[#170702] border-amber-500/50 cursor-pointer"
                    />
                    <span className="text-amber-200 font-bold text-xs">
                      🌟 విశిష్ట దాత బ్యాడ్జ్ (Special Donor Badge)
                    </span>
                  </label>
                  {editForm.status !== 'Verified' && (
                    <span className="text-[10px] text-amber-400/60 italic">Requires verification</span>
                  )}
                </div>

                {editForm.isSpecialDonor && editForm.status === 'Verified' && (
                  <div>
                    <label className="block text-amber-300/80 mb-1 text-[11px]">
                      Special Contribution / విశిష్ట సేవ వివరాలు *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. శ్రీ వినాయక వెండి కిరీటం విరాళం, మహా అన్నదానం స్పాన్సర్..."
                      value={editForm.specialContribution}
                      onChange={(e) => setEditForm({ ...editForm, specialContribution: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/40 text-amber-100 text-xs focus:outline-none focus:border-amber-400 placeholder:text-amber-400/40"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-amber-300/80 mb-1">Devotional Message / Wishes</label>
                <textarea
                  rows="2"
                  value={editForm.message}
                  onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-amber-300/80 mb-1">Payment Screenshot Proof</label>
                <label className="w-full py-2 px-3 rounded-xl bg-[#1e0a04] hover:bg-[#2b1008] border border-amber-500/30 text-amber-200 text-center cursor-pointer flex items-center justify-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isUploadingReceipt ? 'Uploading...' : editForm.receiptUrl ? 'Change Screenshot' : 'Upload Screenshot'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAdminReceiptUpload}
                  />
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDonor(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#2b1008] text-amber-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Public Payment Screenshot Lightbox Modal */}
      {selectedReceiptDonor && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedReceiptDonor(null)}
        >
          <div 
            className="relative w-full max-w-xl bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#120502] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-crimson-900 via-saffron-800 to-crimson-900 p-4 text-center relative border-b border-amber-500/30 shrink-0">
              <button
                onClick={() => setSelectedReceiptDonor(null)}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/40 text-amber-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-devotional text-lg sm:text-xl font-bold gold-gradient-text">
                UPI చెల్లింపు స్క్రీన్‌షాట్ (Payment Screenshot)
              </h3>
              <p className="text-xs text-amber-200/80">
                Donor: <strong className="text-amber-100">{selectedReceiptDonor.name}</strong> • Amount: <strong className="text-amber-300">₹{Number(selectedReceiptDonor.amount).toLocaleString('en-IN')}</strong>
              </p>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div className="bg-black/70 p-3 rounded-2xl border border-amber-500/30 flex flex-col items-center justify-center relative group min-h-[260px]">
                {selectedReceiptDonor.receiptUrl ? (
                  <img 
                    src={selectedReceiptDonor.receiptUrl.startsWith('data:') ? selectedReceiptDonor.receiptUrl : `/api/donors/${selectedReceiptDonor.id}/proof`} 
                    alt={`${selectedReceiptDonor.name} UPI Payment Screenshot`} 
                    className="max-h-[50vh] sm:max-h-[55vh] w-auto max-w-full object-contain rounded-xl shadow-lg border border-amber-500/20"
                    onError={(e) => {
                      if (!e.target.src.includes('/api/donors/')) {
                        e.target.src = `/api/donors/${selectedReceiptDonor.id}/proof`;
                      } else {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement.querySelector('.img-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }
                    }}
                  />
                ) : (
                  <p className="text-amber-400/60 text-xs">No screenshot image recorded for this donor.</p>
                )}

                <div className="img-fallback hidden flex-col items-center justify-center text-center p-6 space-y-3 text-amber-200">
                  <span className="text-3xl">📸</span>
                  <p className="text-xs font-semibold text-amber-300">
                    Payment screenshot recorded for this donor.
                  </p>
                  <p className="text-[11px] text-amber-400/70 max-w-sm">
                    If this is an older record from before cloud storage migration, Admin can re-attach the screenshot below.
                  </p>
                </div>

                {selectedReceiptDonor.receiptUrl && (
                  <div className="mt-3 w-full flex items-center justify-end">
                    <a
                      href={selectedReceiptDonor.receiptUrl.startsWith('data:') ? selectedReceiptDonor.receiptUrl : `/api/donors/${selectedReceiptDonor.id}/proof`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-black/80 hover:bg-black text-amber-300 px-3.5 py-2 rounded-xl border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Full Size Image in New Tab</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Admin Quick Re-upload / Fix Screenshot Tool */}
              {isAdmin && (
                <div className="bg-[#1c0803] p-3.5 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                  <div className="text-left">
                    <h5 className="text-xs font-bold text-amber-200">Admin Screenshot Manager:</h5>
                    <p className="text-[10px] text-amber-400/70">Attach or update the payment screenshot proof directly</p>
                  </div>

                  <label className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-600 text-amber-950 font-extrabold text-xs cursor-pointer hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-gold shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingReceipt ? 'Compressing & Saving... ⏳' : '📷 Upload / Replace Screenshot Proof'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingReceipt}
                      onChange={handleQuickUploadScreenshot}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Bills & Receipts Archive Modal */}
      <ReceiptsArchiveModal
        isOpen={isReceiptsArchiveOpen}
        onClose={() => setIsReceiptsArchiveOpen(false)}
        donors={donors}
        settings={settings}
      />

    </div>
  );
};
