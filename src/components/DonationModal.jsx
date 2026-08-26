import React, { useState, useRef } from 'react';
import { X, Heart, QrCode, CheckCircle2, Copy, Download, Share2, Sparkles, Smartphone, ArrowRight, ShieldCheck, Upload, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { playTempleBell, compressImageToBase64 } from '../utils/audio';
import { downloadDonorReceiptPdf, downloadDonorReceiptPng, sendWhatsAppReceipt } from '../utils/receiptGenerator';
import { enqueueOfflineAction } from '../utils/offlineStorage';

const PRESET_AMOUNTS = [101, 251, 501, 1116, 2116, 5116, 11116];

export const DonationModal = ({ isOpen, onClose, settings, onDonationSuccess }) => {
  const [selectedAmount, setSelectedAmount] = useState(501);
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [receiptImage, setReceiptImage] = useState(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationComplete, setDonationComplete] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const receiptRef = useRef(null);

  if (!isOpen) return null;

  const upiId = settings?.upiId || 'ganeshutsav@upi';
  const upiName = settings?.upiName || 'Ganesh Utsav Committee';
  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  // Construct standard UPI Payment URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent('Vinayaka Chavithi Utsav Donation')}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsCompressingImage(true);
    try {
      const compressedDataUrl = await compressImageToBase64(file);
      setReceiptImage(compressedDataUrl);
    } catch (err) {
      alert(err.message || 'Failed to process image. Please select another image.');
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name or family name');
      return;
    }

    const validatedAmount = customAmount ? Number(customAmount) : Number(selectedAmount);
    if (!validatedAmount || isNaN(validatedAmount) || validatedAmount <= 0) {
      alert('Please enter a valid positive donation amount (Minimum ₹1)');
      return;
    }

    if (paymentMode === 'UPI' && !receiptImage) {
      alert('⚠️ Payment screenshot is compulsory for UPI transactions! Please upload your Google Pay / PhonePe / Paytm payment screenshot.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        amount: Math.abs(Math.floor(validatedAmount)),
        paymentMode,
        referenceNo: referenceNo.trim() || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        message: message.trim(),
        receiptUrl: receiptImage || null
      };

      let result;
      if (!navigator.onLine) {
        enqueueOfflineAction('CREATE_DONOR', payload);
        result = {
          newDonor: {
            ...payload,
            id: 'offline-' + Date.now(),
            createdAt: new Date().toISOString(),
            status: 'pending_sync'
          }
        };
      } else {
        try {
          result = await api.createDonor(payload);
        } catch (apiErr) {
          // Fallback to offline queue on network drops
          enqueueOfflineAction('CREATE_DONOR', payload);
          result = {
            newDonor: {
              ...payload,
              id: 'offline-' + Date.now(),
              createdAt: new Date().toISOString(),
              status: 'pending_sync'
            }
          };
        }
      }
      
      // Auspicious celebration effects
      playTempleBell();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF9800', '#D32F2F', '#FFFFFF']
      });

      setDonationComplete(result.newDonor);
      if (onDonationSuccess) {
        onDonationSuccess(result);
      }
    } catch (err) {
      alert(err.message || 'Failed to submit donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setDonationComplete(null);
    setName('');
    setPhone('');
    setMessage('');
    setReferenceNo('');
    setReceiptImage(null);
    setCustomAmount('');
    setSelectedAmount(501);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#240e06] via-[#1c0803] to-[#140502] border-2 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92dvh] flex flex-col">
        
        {/* Top Auspicious Header Banner */}
        <div className="relative bg-gradient-to-r from-crimson-900 via-saffron-800 to-crimson-900 p-3.5 sm:p-4 text-center border-b border-amber-500/30 shrink-0">
          <button
            onClick={resetAndClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-amber-200 hover:text-white hover:bg-black/60 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-amber-300 font-semibold bg-black/30 px-2.5 py-0.5 rounded-full border border-amber-500/20 mb-1">
            <span>🌺 భక్తితో సమర్పించిన కానుక 🌺</span>
          </div>
          <h3 className="font-devotional text-base sm:text-xl font-bold gold-gradient-text">
            {donationComplete ? 'విరాళ రసీదు | Donation Receipt' : 'గణపతి సేవా విరాళం | Donate to Mandapam'}
          </h3>
          <p className="text-[11px] sm:text-xs text-amber-200/80">
            {settings?.utsavName || 'విజయ కాలనీ గణేష్ యూత్'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 overscroll-contain">

          {donationComplete ? (
            /* Digital Devotional Receipt View */
            <div className="space-y-5 text-center" ref={receiptRef}>
              
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-emerald-400">ధన్యవాదాలు! Donation Recorded</h4>
                <p className="text-xs text-amber-200/80 mt-1">
                  May Lord Varasiddhi Vinayaka shower peace, prosperity, and joy on you & your family!
                </p>
              </div>

              {/* Devotional Receipt Card */}
              <div className="bg-[#2b1007]/90 border border-amber-500/40 rounded-2xl p-5 text-left relative overflow-hidden shadow-inner">
                <div className="absolute top-2 right-2 opacity-10 pointer-events-none">
                  <img src="/ganesha.svg" alt="Ganesha" className="w-28 h-28" />
                </div>

                <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] text-amber-400 uppercase tracking-widest block">Receipt No</span>
                    <span className="text-xs font-mono font-bold text-amber-100">{donationComplete.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-400 uppercase tracking-widest block">Date & Time</span>
                    <span className="text-xs text-amber-200">{new Date(donationComplete.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-300/70">Donor Name:</span>
                    <span className="font-bold text-amber-100">{donationComplete.name}</span>
                  </div>
                  {donationComplete.gotram && (
                    <div className="flex justify-between">
                      <span className="text-amber-300/70">Gotram (గోత్రం):</span>
                      <span className="text-amber-200">{donationComplete.gotram}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-amber-300/70">Payment Mode:</span>
                    <span className="text-amber-200">{donationComplete.paymentMode} ({donationComplete.referenceNo})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-300/70">Status:</span>
                    {donationComplete.status === 'Verified' ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        Verified ✅
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                        Submitted (Pending Verification) ⏳
                      </span>
                    )}
                  </div>
                  {donationComplete.message && (
                    <div className="pt-2 border-t border-amber-500/20">
                      <span className="text-xs text-amber-300/70 block mb-0.5">Devotional Prayer / Message:</span>
                      <p className="text-xs italic text-amber-200">"{donationComplete.message}"</p>
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-dashed border-amber-500/40 flex items-center justify-between">
                    <span className="font-semibold text-amber-200">Donation Amount:</span>
                    <span className="text-2xl font-extrabold gold-gradient-text">
                      ₹{Number(donationComplete.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-500/20 text-center">
                  <p className="text-[11px] text-amber-400/90 font-telugu font-semibold">
                    "సర్వేజనాః సుఖినోభవంతు - సమస్త సన్మంగళాని భవంతు"
                  </p>
                </div>
              </div>

              {/* Receipt Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => sendWhatsAppReceipt(donationComplete, settings)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send to WhatsApp 📱</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadDonorReceiptPdf(donationComplete, settings)}
                  className="py-2.5 px-3 rounded-xl bg-[#2b1008] hover:bg-[#3d170b] border border-amber-500/40 text-amber-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
                  title="Download A4 PDF Official Bill"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>PDF Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadDonorReceiptPng(donationComplete, settings)}
                  className="py-2.5 px-3 rounded-xl bg-[#2b1008] hover:bg-[#3d170b] border border-amber-500/40 text-amber-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
                  title="Download PNG Image Receipt"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>PNG</span>
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold text-xs sm:text-sm hover:brightness-110 shadow-gold"
                >
                  Close & View Donors List ➔
                </button>
              </div>

            </div>
          ) : (
            /* Donation Form & Dynamic UPI QR Section */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* 1. Auspicious Preset Amounts */}
              <div>
                <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">
                  Select Auspicious Amount (విరాళం మొత్తం)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((amt) => {
                    const isSelected = selectedAmount === amt && !customAmount;
                    return (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => {
                          setSelectedAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 shadow-gold border-2 border-yellow-200 scale-105'
                            : 'bg-[#2b1008] text-amber-200 border border-amber-500/30 hover:border-amber-400/60'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    );
                  })}
                  <div className="col-span-1">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Custom ₹"
                      value={customAmount}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E' || e.key === '.') {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setCustomAmount('');
                          setSelectedAmount(501);
                          return;
                        }
                        const num = Math.abs(parseInt(val, 10));
                        if (!isNaN(num) && num > 0) {
                          setCustomAmount(num.toString());
                          setSelectedAmount(0);
                        } else {
                          setCustomAmount('');
                        }
                      }}
                      className={`w-full py-2 px-2 text-xs sm:text-sm font-bold rounded-xl text-center bg-[#2b1008] border focus:outline-none transition-all ${
                        customAmount ? 'border-amber-400 text-amber-100 bg-[#3a160b]' : 'border-amber-500/30 text-amber-300/70'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Interactive UPI Scanner & Dynamic QR Box */}
              <div className="bg-[#190703] border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                
                {/* Official Google Pay Scanner Image / Dynamic QR */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="bg-white p-2.5 rounded-2xl shadow-xl border-2 border-amber-400/60 relative group w-40 h-48 sm:w-44 sm:h-52 overflow-hidden flex flex-col items-center justify-center">
                    <img 
                      src="/upi_scanner.png" 
                      alt="Charan Teja Adishti UPI Scanner" 
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                    <span>Google Pay / PhonePe / Paytm</span>
                  </span>
                </div>

                {/* QR Payment Info */}
                <div className="space-y-2.5 flex-1">
                  <div className="inline-flex items-center gap-1 bg-amber-500/15 px-3 py-1 rounded-full text-xs font-semibold text-amber-300 border border-amber-500/30">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Official Mandapam UPI Scanner</span>
                  </div>

                  <div>
                    <span className="text-xs text-amber-300/70 block">Beneficiary Name (లబ్ధిదారుడు):</span>
                    <p className="text-base font-bold text-amber-100">
                      Charan Teja Adishti
                    </p>
                    <p className="text-xl font-extrabold gold-gradient-text mt-0.5">
                      Amount: ₹{finalAmount ? finalAmount.toLocaleString('en-IN') : 0}
                    </p>
                  </div>

                  <div className="text-xs text-amber-300/80 space-y-1.5">
                    <div className="flex items-center justify-center md:justify-start gap-1.5">
                      <span className="font-mono bg-black/60 px-2.5 py-1 rounded-lg border border-amber-500/40 text-amber-200 text-xs select-all">
                        {upiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:text-white transition-all"
                        title="Copy UPI ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {copiedUpi && <span className="text-xs font-bold text-emerald-400">Copied! ✅</span>}
                    </div>
                    <p className="text-[11px] text-amber-400/70">
                      Scan with Google Pay, PhonePe, Paytm, CRED or any UPI App
                    </p>
                  </div>

                  {/* Direct Mobile Pay CTA */}
                  <a
                    href={upiUri}
                    className="inline-flex md:hidden items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Tap to Pay Directly in UPI App</span>
                  </a>
                </div>

              </div>

              {/* 3. Donor Details Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-amber-300 mb-1">
                      Donor Name / Family Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh & Family"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#2b1008] border border-amber-500/30 text-amber-100 text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-amber-300 mb-1 flex items-center justify-between">
                      <span>Mobile / WhatsApp Number</span>
                      <span className="text-[10px] text-emerald-400 font-bold">📲 WhatsApp Receipt</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 98480 12345 (రశీదు పొందడానికి)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#2b1008] border border-amber-500/30 text-amber-100 text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-amber-300 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#2b1008] border border-amber-500/30 text-amber-100 text-sm focus:outline-none focus:border-amber-400"
                    >
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Cash">Cash (Directly given at Mandapam)</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1">
                    Transaction ID / UTR / Note
                  </label>
                  <input
                    type="text"
                    placeholder="Enter UPI reference or UTR number after payment"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#2b1008] border border-amber-500/30 text-amber-100 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1">
                    Devotional Wish / Prayer Message (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Om Ganapathaye Namaha! Best wishes for grand celebrations."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#2b1008] border border-amber-500/30 text-amber-100 text-sm focus:outline-none focus:border-amber-400 resize-none"
                  ></textarea>
                </div>

                {/* Screenshot Upload (Compulsory for UPI) */}
                {/* Screenshot Upload (Compulsory for UPI) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-amber-300 flex items-center gap-1">
                      <span>Attach Payment Screenshot</span>
                      {paymentMode === 'UPI' ? (
                        <span className="text-red-400 font-bold">* (Compulsory for UPI)</span>
                      ) : (
                        <span className="text-amber-400/60 font-normal">(Optional for Cash)</span>
                      )}
                    </label>
                  </div>

                  {receiptImage ? (
                    <div className="p-3 bg-black/70 border-2 border-emerald-500/70 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Screenshot Ready & Attached ✓</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setReceiptImage(null)}
                          className="text-[11px] text-red-400 hover:text-red-300 underline font-semibold"
                        >
                          Remove / Change
                        </button>
                      </div>
                      <div className="flex justify-center bg-black/50 p-2 rounded-xl border border-emerald-500/30">
                        <img
                          src={receiptImage}
                          alt="Attached payment screenshot preview"
                          className="max-h-36 object-contain rounded-lg shadow-md"
                        />
                      </div>
                    </div>
                  ) : (
                    <label className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      paymentMode === 'UPI' 
                        ? 'bg-[#2b1008] border-red-500/50 hover:border-red-400 text-amber-200 shadow-sm' 
                        : 'bg-[#2b1008] border-amber-500/30 text-amber-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Upload className={`w-4 h-4 ${paymentMode === 'UPI' ? 'text-red-400' : 'text-amber-400'}`} />
                        <span className="font-semibold">
                          {isCompressingImage 
                            ? 'Processing & Securing Screenshot... ⏳' 
                            : (paymentMode === 'UPI' ? 'Tap to Upload UPI Screenshot (Required *)' : 'Choose screenshot from gallery')}
                        </span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        disabled={isCompressingImage}
                        onChange={handleReceiptUpload} 
                        className="hidden" 
                      />
                    </label>
                  )}

                  {paymentMode === 'UPI' && !receiptImage && !isCompressingImage && (
                    <p className="text-[10px] text-red-300/90 mt-1 flex items-center gap-1">
                      <span>⚠️ Please take a screenshot of your Google Pay / PhonePe transaction and attach it above.</span>
                    </p>
                  )}
                </div>

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-600 text-amber-950 font-bold text-base shadow-divine hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Recording Donation...</span>
                ) : (
                  <>
                    <Heart className="w-5 h-5 fill-crimson-900 text-crimson-900" />
                    <span>Submit & Confirm Donation (₹{finalAmount})</span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>

      </div>

    </div>
  );
};
