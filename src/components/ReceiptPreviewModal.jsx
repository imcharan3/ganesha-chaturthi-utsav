import React, { useState, useEffect } from 'react';
import { X, Printer, Share2, Download } from 'lucide-react';
import { generateDonorReceiptCanvas, getWhatsAppReceiptText } from '../utils/receiptGenerator';

export const ReceiptPreviewModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [donorData, setDonorData] = useState(null);
  const [settingsData, setSettingsData] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleOpenReceipt = async (e) => {
      const { donor, settings } = e.detail || {};
      if (!donor) return;
      setDonorData(donor);
      setSettingsData(settings);
      setIsOpen(true);
      setIsLoading(true);

      try {
        const canvas = await generateDonorReceiptCanvas(donor, settings);
        const url = canvas.toDataURL('image/png', 0.95);
        setImageUrl(url);
      } catch (err) {
        console.error('Error generating preview canvas:', err);
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener('open-receipt-preview-modal', handleOpenReceipt);
    return () => window.removeEventListener('open-receipt-preview-modal', handleOpenReceipt);
  }, []);

  if (!isOpen || !donorData) return null;

  const handleClose = () => {
    setIsOpen(false);
    setImageUrl('');
    setDonorData(null);
  };

  const handlePrint = () => {
    if (!imageUrl) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>విజయ కాలనీ గణేష్ డైరీస్ - రసీదు (${donorData.receiptNo || 'REC'})</title>
            <style>
              @page { size: A4 portrait; margin: 0; }
              body { margin: 0; display: flex; align-items: center; justify-content: center; background: #000; height: 100vh; }
              img { width: 100%; max-width: 210mm; height: auto; display: block; margin: auto; }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" onload="window.print(); setTimeout(() => window.close(), 1000);" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  const handleDownloadImage = () => {
    if (!imageUrl) return;
    const safeName = (donorData.name || 'Donor').replace(/\s+/g, '_');
    const filename = `Ganesha_Receipt_${donorData.receiptNo || 'REC'}_${safeName}.png`;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhatsAppShare = () => {
    const text = getWhatsAppReceiptText(donorData, settingsData);
    const phone = donorData.phone ? donorData.phone.replace(/\D/g, '') : '';
    let url = '';
    if (phone.length === 10) {
      url = `https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(text)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#240e06] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-[#381408] via-[#240e06] to-[#381408] border-b border-amber-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪔</span>
            <div>
              <h3 className="text-amber-200 font-bold text-sm sm:text-base leading-tight">
                అధికారిక విరాళ రసీదు (Official Receipt)
              </h3>
              <p className="text-amber-400/70 text-[11px]">
                రసీదు నెం: <span className="font-mono text-amber-300 font-bold">{donorData.receiptNo || 'VCGD-REC'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-amber-950/60 hover:bg-amber-900 border border-amber-500/30 text-amber-300 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: High-Res Receipt Image Preview */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col items-center justify-center bg-[#170502]/90">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
              <p className="text-amber-300 text-xs font-medium animate-pulse">రసీదు సిద్ధం చేయబడుతోంది...</p>
            </div>
          ) : imageUrl ? (
            <div className="w-full flex justify-center">
              <img
                src={imageUrl}
                alt="Ganesha Devotional Receipt"
                className="w-full max-w-[380px] rounded-2xl shadow-2xl border border-amber-500/40 object-contain hover:scale-[1.01] transition-transform"
              />
            </div>
          ) : (
            <div className="py-12 text-center text-amber-300/70 text-xs">
              రసీదు లోడ్ చేయడంలో సమస్య వచ్చింది.
            </div>
          )}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="p-3 sm:p-4 bg-[#200b05] border-t border-amber-500/30 flex flex-col gap-2 shrink-0">
          <div className="grid grid-cols-3 gap-2">
            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>WhatsApp 📱</span>
            </button>

            {/* Print / Save PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>PDF / Print ⎙</span>
            </button>

            {/* Save Image / PNG Button */}
            <button
              type="button"
              onClick={handleDownloadImage}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#381408] hover:bg-[#4a1c0d] border border-amber-500/50 text-amber-200 font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 text-amber-400 shrink-0" />
              <span>PNG Image 🖼️</span>
            </button>
          </div>

          <p className="text-center text-[10px] text-amber-400/60 pt-1">
            ✨ 'PDF / Print' నొక్కి మీ ఫోన్‌లో 'Save as PDF' ద్వారా ఫైల్‌ను భద్రపరుచుకోవచ్చు.
          </p>
        </div>

      </div>
    </div>
  );
};
