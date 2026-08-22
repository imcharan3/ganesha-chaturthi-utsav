import React, { useState, useMemo } from 'react';
import { Heart, Search, Filter, ArrowUpDown, Trash2, Edit3, Shield, Download, Plus, CheckCircle, Sparkles, Trophy, UserCheck, Eye, Image as ImageIcon, ExternalLink, X, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const DonorsList = ({ donors, stats, onOpenDonation, onRefreshDonors }) => {
  const { isAdmin, adminToken, setIsAdminModalOpen } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'highest' | 'lowest'
  const [filterTier, setFilterTier] = useState('all'); // 'all' | 'maha' | 'above1000' | 'below1000'
  
  // Public Screenshot Lightbox Modal State (Viewable by everyone)
  const [selectedReceiptDonor, setSelectedReceiptDonor] = useState(null);

  // Edit State for Admin
  const [editingDonor, setEditingDonor] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', gotram: '', amount: '', message: '', status: 'Verified', receiptUrl: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  // Filtered & Sorted Donors
  const filteredDonors = useMemo(() => {
    return (donors || [])
      .filter((d) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          d.name?.toLowerCase().includes(query) ||
          d.gotram?.toLowerCase().includes(query) ||
          d.referenceNo?.toLowerCase().includes(query) ||
          d.message?.toLowerCase().includes(query);

        if (!matchesSearch) return false;

        const amt = Number(d.amount) || 0;
        if (filterTier === 'maha') return amt >= 5000;
        if (filterTier === 'above1000') return amt >= 1000;
        if (filterTier === 'below1000') return amt < 1000;
        return true;
      })
      .sort((a, b) => {
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
      name: donor.name,
      gotram: donor.gotram || '',
      amount: donor.amount,
      message: donor.message || '',
      status: donor.status || 'Verified',
      receiptUrl: donor.receiptUrl || ''
    });
  };

  const handleAdminReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingReceipt(true);
    try {
      const uploadRes = await api.uploadImage(file);
      setEditForm(prev => ({ ...prev, receiptUrl: uploadRes.fileUrl }));
    } catch (err) {
      alert('Failed to upload replacement receipt');
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
        gotram: editForm.gotram.trim(),
        amount: Number(editForm.amount),
        message: editForm.message.trim(),
        status: editForm.status,
        receiptUrl: editForm.receiptUrl || null
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

  // Export Donors to CSV / Excel (with UTF-8 BOM for perfect Microsoft Excel Unicode & Telugu display)
  const handleExportCSV = () => {
    if (!donors || donors.length === 0) {
      alert('No donor records to export');
      return;
    }

    const headers = [
      'Receipt ID',
      'Donor Name (దాత పేరు)',
      'Gotram (గోత్రం)',
      'Amount (₹)',
      'Payment Mode',
      'Reference / UTR No',
      'Verification Status',
      'Date & Time',
      'Devotional Message / Wishes',
      'Screenshot Receipt URL'
    ];

    const cleanField = (val) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = donors.map(d => [
      cleanField(d.id || ''),
      cleanField(d.name || ''),
      cleanField(d.gotram || 'Shiva'),
      d.amount || 0,
      cleanField(d.paymentMode || 'UPI'),
      cleanField(d.referenceNo || ''),
      cleanField(d.status || 'Verified'),
      cleanField(new Date(d.createdAt).toLocaleString('en-IN')),
      cleanField(d.message || ''),
      cleanField(d.receiptUrl ? `${window.location.origin}${d.receiptUrl}` : '')
    ]);

    // UTF-8 BOM (\uFEFF) forces Microsoft Excel to open Telugu script, ₹ symbols & names in pristine UTF-8
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="temple-card p-6 rounded-3xl shadow-xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
            <Heart className="w-3.5 h-3.5 fill-saffron-500 text-saffron-500" />
            <span>పారదర్శక దాతల జాబితా • Transparent Ledger</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold gold-gradient-text font-devotional">
            శ్రీ వినాయక చవితి దాతల వివరాలు (Donors List)
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/80">
            మండపం మరియు అన్నదాన కార్యక్రమాలకు విరాళాలు సమర్పించిన గౌరవనీయ భక్తుల వివరాలు.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpenDonation}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-600 text-amber-950 font-bold text-xs sm:text-sm shadow-gold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add My Donation (విరాళం ఇవ్వండి)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-[#2b1008] hover:bg-[#3c170b] border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all"
            title="Download CSV for Committee Records"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>

          {isAdmin ? (
            <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/50 px-3 py-2 rounded-xl text-xs text-emerald-300 font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Mode: Edit / Delete Enabled</span>
            </div>
          ) : (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="text-xs text-amber-400/80 hover:text-amber-200 underline flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topDonors.map((donor, idx) => {
              const rankColors = [
                'from-amber-500/20 via-yellow-500/10 to-amber-950/40 border-amber-400/60 text-amber-300',
                'from-slate-400/20 via-slate-500/10 to-amber-950/40 border-slate-400/50 text-slate-200',
                'from-amber-700/20 via-amber-800/10 to-amber-950/40 border-amber-700/50 text-amber-400'
              ];
              const rankBadges = ['🥇 1st Maha Daata', '🥈 2nd Maha Daata', '🥉 3rd Maha Daata'];

              return (
                <div
                  key={donor.id}
                  className={`bg-gradient-to-br ${rankColors[idx]} p-4 rounded-2xl border backdrop-blur-md relative overflow-hidden shadow-lg`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/40 border border-amber-500/30">
                      {rankBadges[idx]}
                    </span>
                    <span className="text-lg font-extrabold gold-gradient-text">
                      ₹{Number(donor.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-amber-100 line-clamp-1">{donor.name}</h4>
                  <p className="text-xs text-amber-300/80">Gotram: {donor.gotram || 'Shiva'}</p>
                  {donor.message && (
                    <p className="text-xs italic text-amber-200/70 mt-2 line-clamp-1">"{donor.message}"</p>
                  )}
                  {donor.receiptUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptDonor(donor)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 mt-2.5 rounded-lg bg-black/50 hover:bg-black/70 border border-amber-400/40 text-amber-300 hover:text-amber-100 text-[11px] font-semibold transition-all shadow-sm"
                      title="View payment screenshot"
                    >
                      <Eye className="w-3 h-3 text-amber-400" />
                      <span>View Screenshot (రసీదు)</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-[#240e06] p-4 rounded-2xl border border-amber-500/30 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, gotram, note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#170702] border border-amber-500/30 text-amber-100 text-xs sm:text-sm focus:outline-none focus:border-amber-400 placeholder:text-amber-400/40"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          
          {/* Amount Tier Filter */}
          <div className="flex items-center gap-1 bg-[#170702] border border-amber-500/30 rounded-xl p-1 text-xs max-w-full overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterTier('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterTier === 'all' ? 'bg-amber-500 text-amber-950 font-bold' : 'text-amber-300 hover:text-white'
              }`}
            >
              All ({donors?.length || 0})
            </button>
            <button
              onClick={() => setFilterTier('maha')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterTier === 'maha' ? 'bg-amber-500 text-amber-950 font-bold' : 'text-amber-300 hover:text-white'
              }`}
            >
              ≥ ₹5,000
            </button>
            <button
              onClick={() => setFilterTier('above1000')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterTier === 'above1000' ? 'bg-amber-500 text-amber-950 font-bold' : 'text-amber-300 hover:text-white'
              }`}
            >
              ≥ ₹1,000
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1 bg-[#170702] border border-amber-500/30 rounded-xl px-2 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-amber-200 focus:outline-none text-xs cursor-pointer py-1"
            >
              <option value="newest" className="bg-[#240e06]">Latest Added</option>
              <option value="highest" className="bg-[#240e06]">Highest Amount</option>
              <option value="lowest" className="bg-[#240e06]">Lowest Amount</option>
            </select>
          </div>

        </div>

      </div>

      {/* Donors List Table / Card View */}
      <div className="space-y-3">
        {filteredDonors.length === 0 ? (
          <div className="temple-card p-10 text-center rounded-3xl border border-amber-500/30 space-y-3">
            <Heart className="w-12 h-12 text-amber-500/40 mx-auto" />
            <p className="text-base font-semibold text-amber-200">No donor records found</p>
            <p className="text-xs text-amber-400/60">Try changing your search keywords or be the first to contribute!</p>
            <button
              onClick={onOpenDonation}
              className="mt-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold text-xs"
            >
              Donate Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDonors.map((donor) => {
              const isMajor = Number(donor.amount) >= 5000;

              return (
                <div
                  key={donor.id}
                  className={`temple-card p-4 rounded-2xl border transition-all duration-200 relative group ${
                    isMajor ? 'border-amber-400/50 bg-gradient-to-r from-[#2f1309] to-[#200b05]' : 'border-amber-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    
                    {/* Left: Donor Info */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-amber-100 group-hover:text-amber-300 transition-colors">
                          {donor.name}
                        </h4>
                        {isMajor && (
                          <span className="text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 px-2 py-0.5 rounded-full shadow-gold">
                            ⭐ Maha Daata
                          </span>
                        )}
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>{donor.status || 'Verified'}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-amber-300/70">
                        {donor.gotram && <span>గోత్రం: <strong className="text-amber-200">{donor.gotram}</strong></span>}
                        <span>Mode: <strong className="text-amber-200">{donor.paymentMode || 'UPI'}</strong></span>
                        <span className="text-amber-400/50">•</span>
                        <span>{new Date(donor.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>

                      {donor.message && (
                        <p className="text-xs italic text-amber-200/80 pt-1">
                          "{donor.message}"
                        </p>
                      )}

                      {/* Public Payment Screenshot Trigger (Viewable by everyone) */}
                      {donor.receiptUrl && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptDonor(donor)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 hover:text-white text-xs font-semibold shadow-sm transition-all group/btn"
                            title="View uploaded payment screenshot receipt"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400 group-hover/btn:scale-110 transition-transform" />
                            <span>View Payment Screenshot (రసీదు చూడండి)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Amount & Admin Actions */}
                    <div className="text-right flex flex-col items-end justify-between self-stretch shrink-0">
                      <p className="text-lg sm:text-xl font-extrabold gold-gradient-text font-mono">
                        ₹{Number(donor.amount).toLocaleString('en-IN')}
                      </p>

                      {/* Admin Controls */}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-amber-500/20">
                          <button
                            onClick={() => handleOpenEdit(donor)}
                            className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-amber-950 transition-all text-xs"
                            title="Edit Donor Details (Admin Only)"
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

      {/* Public Payment Screenshot Lightbox Modal (Viewable by Everyone) */}
      {selectedReceiptDonor && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedReceiptDonor(null)}
        >
          <div 
            className="relative w-full max-w-xl bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#120502] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-crimson-900 via-saffron-800 to-crimson-900 p-4 text-center relative border-b border-amber-500/30 shrink-0">
              <button
                onClick={() => setSelectedReceiptDonor(null)}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/40 text-amber-200 hover:text-white hover:bg-black/60 transition-all"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-semibold bg-black/30 px-3 py-0.5 rounded-full border border-amber-500/20 mb-1">
                <span>🧾 అధికారిక చెల్లింపు రసీదు • Official Payment Proof</span>
              </div>
              <h3 className="font-devotional text-lg sm:text-xl font-bold gold-gradient-text">
                UPI చెల్లింపు స్క్రీన్‌షాట్ (Payment Screenshot)
              </h3>
              <p className="text-xs text-amber-200/80">
                Donor: <strong className="text-amber-100">{selectedReceiptDonor.name}</strong> • Amount: <strong className="text-amber-300">₹{Number(selectedReceiptDonor.amount).toLocaleString('en-IN')}</strong>
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              
              {/* High-Resolution Screenshot Image Box */}
              <div className="bg-black/70 p-2 rounded-2xl border border-amber-500/30 flex items-center justify-center relative group min-h-[220px]">
                <img 
                  src={selectedReceiptDonor.receiptUrl} 
                  alt={`${selectedReceiptDonor.name} UPI Payment Screenshot`} 
                  className="max-h-[50vh] sm:max-h-[55vh] w-auto max-w-full object-contain rounded-xl shadow-lg border border-amber-500/20"
                />
                <a
                  href={selectedReceiptDonor.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-4 right-4 bg-black/80 hover:bg-black text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 shadow-md backdrop-blur-sm transition-all"
                  title="Open full size in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Size</span>
                </a>
              </div>

              {/* Donor Information Summary Ledger */}
              <div className="bg-[#190703] border border-amber-500/30 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-black/30 p-2 rounded-xl border border-amber-500/15">
                    <span className="text-[10px] text-amber-400/70 block">Donor Name</span>
                    <strong className="text-amber-100 text-xs sm:text-sm">{selectedReceiptDonor.name}</strong>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl border border-amber-500/15">
                    <span className="text-[10px] text-amber-400/70 block">Gotram (గోత్రం)</span>
                    <strong className="text-amber-100 text-xs sm:text-sm">{selectedReceiptDonor.gotram || 'Shiva'}</strong>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl border border-amber-500/15">
                    <span className="text-[10px] text-amber-400/70 block">Amount</span>
                    <strong className="text-amber-300 font-extrabold text-sm sm:text-base gold-gradient-text">
                      ₹{Number(selectedReceiptDonor.amount).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl border border-amber-500/15">
                    <span className="text-[10px] text-amber-400/70 block">Status</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>{selectedReceiptDonor.status || 'Verified'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-amber-300/80 pt-1 border-t border-amber-500/15">
                  <span>Payment Mode: <strong>{selectedReceiptDonor.paymentMode || 'UPI'}</strong></span>
                  <span>Ref/UTR: <strong className="font-mono">{selectedReceiptDonor.referenceNo || 'N/A'}</strong></span>
                  <span>Date: <strong>{new Date(selectedReceiptDonor.createdAt).toLocaleString('en-IN')}</strong></span>
                </div>

                {selectedReceiptDonor.message && (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-amber-200 italic">
                    "{selectedReceiptDonor.message}"
                  </div>
                )}
              </div>

              {/* Admin Alter/Edit Action */}
              {isAdmin ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const donorToEdit = selectedReceiptDonor;
                      setSelectedReceiptDonor(null);
                      handleOpenEdit(donorToEdit);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin: Alter / Edit This Donor Record</span>
                  </button>
                </div>
              ) : (
                <p className="text-center text-[11px] text-amber-400/60">
                  🔒 Verified by Vijaya Colony Ganesha Committee. Only admins can alter or delete donor records.
                </p>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Admin Edit Modal (Admin Only) */}
      {editingDonor && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-[#240e06] border border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto custom-scrollbar">
            <h3 className="font-devotional text-lg font-bold gold-gradient-text flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>Admin: Alter / Edit Donor Record</span>
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Donor Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/40 text-amber-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-amber-300 mb-1 font-semibold">Gotram</label>
                  <input
                    type="text"
                    value={editForm.gotram}
                    onChange={(e) => setEditForm({ ...editForm, gotram: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/40 text-amber-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-amber-300 mb-1 font-semibold">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/40 text-amber-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Payment Screenshot Receipt</label>
                {editForm.receiptUrl ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#170702] border border-amber-500/30">
                    <div className="flex items-center gap-2">
                      <img src={editForm.receiptUrl} alt="Receipt preview" className="w-8 h-8 object-cover rounded border border-amber-500/40" />
                      <span className="text-xs text-amber-200">Screenshot Attached</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, receiptUrl: '' })}
                      className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 bg-red-950/40 rounded border border-red-500/30"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#170702] border border-dashed border-amber-500/40 text-amber-300 text-xs cursor-pointer hover:border-amber-400">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>{isUploadingReceipt ? 'Uploading screenshot...' : 'Upload Replacement Screenshot'}</span>
                    <input type="file" accept="image/*" onChange={handleAdminReceiptUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Message / Prayer</label>
                <textarea
                  rows={2}
                  value={editForm.message}
                  onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/40 text-amber-100 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Verification Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/40 text-amber-100 focus:outline-none"
                >
                  <option value="Verified">Verified ✅</option>
                  <option value="Special Donor">Special Donor ⭐</option>
                  <option value="Pending Verification">Pending Verification ⏳</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDonor(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#34160b] text-amber-200 hover:bg-[#431c0e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold hover:brightness-110"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
