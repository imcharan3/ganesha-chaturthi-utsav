import React, { useState, useMemo } from 'react';
import { 
  X, Receipt, Search, Download, Share2, FileText, CheckCircle2, 
  Eye, Calendar, Phone, Heart, Sparkles, Filter, ExternalLink, Printer 
} from 'lucide-react';
import { 
  downloadDonorReceiptPdf, 
  downloadDonorReceiptPng, 
  sendWhatsAppReceipt, 
  generateDonorReceiptCanvas 
} from '../utils/receiptGenerator';

export const ReceiptsArchiveModal = ({ isOpen, onClose, donors = [], settings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'highest' | 'lowest'
  const [filterTier, setFilterTier] = useState('all'); // 'all' | 'above1000' | 'below1000'
  const [previewDonor, setPreviewDonor] = useState(null);
  const [previewCanvasUrl, setPreviewCanvasUrl] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Filter only verified donors with receipts
  const verifiedDonors = useMemo(() => {
    return donors.filter(d => d.status === 'Verified' || d.receiptNo);
  }, [donors]);

  // Search and Sort
  const filteredReceipts = useMemo(() => {
    return verifiedDonors
      .filter((d) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          !query ||
          d.name?.toLowerCase().includes(query) ||
          d.receiptNo?.toLowerCase().includes(query) ||
          d.phone?.includes(query) ||
          d.gotram?.toLowerCase().includes(query) ||
          d.referenceNo?.toLowerCase().includes(query);

        if (!matchesQuery) return false;

        const amt = Number(d.amount) || 0;
        if (filterTier === 'above1000') return amt >= 1000;
        if (filterTier === 'below1000') return amt < 1000;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
        if (sortBy === 'lowest') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
        if (sortBy === 'oldest') return new Date(a.verifiedAt || a.createdAt || 0) - new Date(b.verifiedAt || b.createdAt || 0);
        // Default newest
        return new Date(b.verifiedAt || b.createdAt || 0) - new Date(a.verifiedAt || a.createdAt || 0);
      });
  }, [verifiedDonors, searchQuery, sortBy, filterTier]);

  const totalReceiptsAmount = useMemo(() => {
    return verifiedDonors.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [verifiedDonors]);

  const handleOpenPreview = async (donor) => {
    setPreviewDonor(donor);
    setIsGeneratingPreview(true);
    try {
      const canvas = await generateDonorReceiptCanvas(donor, settings);
      setPreviewCanvasUrl(canvas.toDataURL('image/png', 1.0));
    } catch (err) {
      console.error('Error generating preview:', err);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleDownloadPdf = async (donor) => {
    setIsDownloading(true);
    try {
      await downloadDonorReceiptPdf(donor, settings);
    } catch (err) {
      alert('Failed to generate PDF receipt: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPng = async (donor) => {
    setIsDownloading(true);
    try {
      await downloadDonorReceiptPng(donor, settings);
    } catch (err) {
      alert('Failed to generate PNG receipt: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Export All Bills to CSV
  const handleExportBillsCsv = () => {
    if (verifiedDonors.length === 0) {
      alert('No verified receipts found to export.');
      return;
    }

    const headers = [
      'Receipt No (రశీదు నెం)',
      'Donor Name (దాత పేరు)',
      'Gotram (గోత్రం)',
      'Phone Number (ఫోన్)',
      'Donation Amount (₹)',
      'Payment Mode (విధానం)',
      'Reference / UTR No',
      'Created Timestamp',
      'Verified Timestamp',
      'Verification Status'
    ];

    const rows = verifiedDonors.map((d) => [
      d.receiptNo || 'N/A',
      `"${(d.name || '').replace(/"/g, '""')}"`,
      `"${(d.gotram || 'Shiva').replace(/"/g, '""')}"`,
      `"${d.phone || ''}"`,
      Number(d.amount) || 0,
      `"${d.paymentMode || 'UPI'}"`,
      `"${d.referenceNo || ''}"`,
      `"${new Date(d.createdAt).toLocaleString('en-IN')}"`,
      `"${d.verifiedAt ? new Date(d.verifiedAt).toLocaleString('en-IN') : 'N/A'}"`,
      `"${d.status || 'Verified'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Vijaya_Colony_Ganesha_Bills_Archive_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#120502] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden max-h-[94dvh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-crimson-900 via-saffron-800 to-crimson-900 p-4 text-center relative border-b border-amber-500/30 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/40 text-amber-200 hover:text-white hover:bg-black/60 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-semibold bg-black/30 px-3 py-0.5 rounded-full border border-amber-500/20 mb-1">
            <span>🧾 అధికారిక రశీదుల రికార్డులు • Bills & Receipts Archive</span>
          </div>
          <h3 className="font-devotional text-lg sm:text-2xl font-bold gold-gradient-text">
            విరాళ రశీదుల ఆర్కైవ్ | Official Receipts Ledger
          </h3>
          <p className="text-xs text-amber-200/80">
            {settings?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్'} • All Verified Bills with Timestamps & Direct Delivery
          </p>
        </div>

        {/* Stats Strip & Controls */}
        <div className="p-4 sm:p-5 border-b border-amber-500/20 bg-[#160602] shrink-0 space-y-3">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Counts Summary */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="bg-[#240c06] border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-left">
                <span className="text-[10px] text-amber-300/70 block">Total Issued Bills</span>
                <span className="text-sm font-bold text-amber-200">{verifiedDonors.length} రశీదులు</span>
              </div>
              <div className="bg-[#240c06] border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-left">
                <span className="text-[10px] text-amber-300/70 block">Total Receipts Sum</span>
                <span className="text-sm font-bold gold-gradient-text">₹{totalReceiptsAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportBillsCsv}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#2b1008] hover:bg-[#3d170b] border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export All Bills (CSV / Excel)</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Receipt No (e.g. VCGD-REC-1001), Donor Name, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1c0803] border border-amber-500/30 text-amber-100 text-xs focus:outline-none focus:border-amber-400 placeholder:text-amber-400/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400/60 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#1c0803] border border-amber-500/30 text-amber-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none flex-1 sm:flex-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>

              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="bg-[#1c0803] border border-amber-500/30 text-amber-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none flex-1 sm:flex-none"
              >
                <option value="all">All Amounts</option>
                <option value="above1000">₹1000 & Above</option>
                <option value="below1000">Below ₹1000</option>
              </select>
            </div>
          </div>

        </div>

        {/* Content - Bills List */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          
          {filteredReceipts.length === 0 ? (
            <div className="p-8 text-center bg-[#180702] rounded-2xl border border-amber-500/20 text-amber-300/60 space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-amber-500/30" />
              <p className="text-sm font-semibold">No verified receipts found matching your search.</p>
              <p className="text-xs text-amber-400/50">When donors make contributions and are verified by Admin, their official bills with timestamps will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredReceipts.map((receipt) => {
                const verifiedDate = receipt.verifiedAt || receipt.createdAt;
                const dateStr = new Date(verifiedDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
                const timeStr = new Date(verifiedDate).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={receipt.id}
                    className="bg-[#1c0803]/90 hover:bg-[#240b04] border border-amber-500/30 hover:border-amber-500/60 p-4 rounded-2xl shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    {/* Top Row: Receipt No & Amount */}
                    <div className="flex items-start justify-between gap-2 border-b border-amber-500/20 pb-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono font-extrabold text-amber-300 bg-black/40 px-2 py-0.5 rounded-lg border border-amber-500/30">
                            {receipt.receiptNo || 'VCGD-REC'}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Verified</span>
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white font-devotional line-clamp-1 pt-0.5">
                          {receipt.name}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-black gold-gradient-text font-mono">
                          ₹{Number(receipt.amount).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-amber-400/60 block">{receipt.paymentMode || 'UPI'}</span>
                      </div>
                    </div>

                    {/* Middle Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-amber-200/80">
                      <div>
                        <span className="text-[10px] text-amber-400/60 block">Gotram:</span>
                        <span className="font-semibold text-amber-100">{receipt.gotram || 'శివ గోత్రం'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-400/60 block">Mobile Phone:</span>
                        <span className="font-semibold text-amber-100">{receipt.phone ? `+91 ${receipt.phone}` : 'Not provided'}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1 text-[11px] text-amber-300/70 pt-0.5">
                        <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Issued Timestamp: <strong>{dateStr} at {timeStr}</strong></span>
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-1.5">
                      
                      {/* WhatsApp Receipt Button */}
                      <button
                        type="button"
                        onClick={() => sendWhatsAppReceipt(receipt, settings)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
                        title="Send Official Devotional Receipt via WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Send WhatsApp Receipt</span>
                      </button>

                      {/* Download PDF */}
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(receipt)}
                        disabled={isDownloading}
                        className="py-1.5 px-2.5 rounded-xl bg-[#2b1008] hover:bg-[#3d170b] border border-amber-500/40 text-amber-200 text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
                        title="Download A4 PDF Devotional Receipt"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>PDF</span>
                      </button>

                      {/* Download PNG */}
                      <button
                        type="button"
                        onClick={() => handleDownloadPng(receipt)}
                        disabled={isDownloading}
                        className="py-1.5 px-2 rounded-xl bg-[#2b1008] hover:bg-[#3d170b] border border-amber-500/40 text-amber-200 text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
                        title="Download Image (PNG) Receipt"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>PNG</span>
                      </button>

                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(receipt)}
                        className="py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
                        title="View Full Devotional Receipt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Devotional Full Receipt Preview Lightbox Modal */}
      {previewDonor && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => { setPreviewDonor(null); setPreviewCanvasUrl(null); }}
        >
          <div 
            className="relative w-full max-w-xl bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#120502] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden max-h-[94dvh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Header */}
            <div className="bg-gradient-to-r from-crimson-900 via-saffron-800 to-crimson-900 p-3.5 text-center relative border-b border-amber-500/30 shrink-0">
              <button
                onClick={() => { setPreviewDonor(null); setPreviewCanvasUrl(null); }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-amber-200 hover:text-white hover:bg-black/60 transition-all"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="font-devotional text-base font-bold gold-gradient-text">
                అధికారిక విరాళ రశీదు • Devotional Receipt Preview
              </h4>
              <p className="text-[11px] text-amber-200/80">
                Receipt No: <strong className="text-amber-100">{previewDonor.receiptNo || 'VCGD-REC'}</strong> • Donor: <strong className="text-amber-100">{previewDonor.name}</strong>
              </p>
            </div>

            {/* Preview Body */}
            <div className="p-3 sm:p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col items-center justify-center min-h-[300px]">
              {isGeneratingPreview ? (
                <div className="text-amber-300 text-xs animate-pulse flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Generating official devotional receipt...</span>
                </div>
              ) : previewCanvasUrl ? (
                <img
                  src={previewCanvasUrl}
                  alt="Devotional Receipt"
                  className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-amber-500/40"
                />
              ) : null}
            </div>

            {/* Preview Footer Actions */}
            <div className="p-3.5 bg-[#160602] border-t border-amber-500/20 flex flex-wrap items-center justify-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => sendWhatsAppReceipt(previewDonor, settings)}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Send to WhatsApp (+91 {previewDonor.phone || '...'})</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPdf(previewDonor)}
                className="py-2 px-3.5 rounded-xl bg-[#2b1008] hover:bg-[#3d170b] border border-amber-500/40 text-amber-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPng(previewDonor)}
                className="py-2 px-3.5 rounded-xl bg-[#2b1008] hover:bg-[#3d170b] border border-amber-500/40 text-amber-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download PNG</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
