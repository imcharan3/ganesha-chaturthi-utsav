import React, { useState, useEffect } from 'react';
import { X, Printer, Share2, FileText, Download, Heart, Sparkles, CheckCircle2 } from 'lucide-react';

export const LedgerReportModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState('donors'); // 'donors' | 'auction' | 'expenses'
  const [reportData, setReportData] = useState(null);
  const [settingsData, setSettingsData] = useState(null);

  useEffect(() => {
    const handleOpenLedger = (e) => {
      const { type = 'donors', data, settings } = e.detail || {};
      setReportType(type);
      setReportData(data);
      setSettingsData(settings);
      setIsOpen(true);
    };

    window.addEventListener('open-ledger-report-modal', handleOpenLedger);
    return () => window.removeEventListener('open-ledger-report-modal', handleOpenLedger);
  }, []);

  if (!isOpen || !reportData) return null;

  const utsavTitle = settingsData?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్ 2026';

  // For Donors Ledger (Include real records)
  const allReportDonors = Array.isArray(reportData) 
    ? reportData.filter(d => !d.isSample)
    : [];

  const sortedDonors = [...allReportDonors].sort((a, b) => {
    if (a.isSpecialDonor && !b.isSpecialDonor) return -1;
    if (!a.isSpecialDonor && b.isSpecialDonor) return 1;
    return (Number(b.amount) || 0) - (Number(a.amount) || 0);
  });

  const totalPledged = sortedDonors.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalPaid = sortedDonors.reduce((sum, d) => {
    const pStatus = d.paymentStatus || (d.status === 'Verified' ? 'Paid' : 'Unpaid');
    if (pStatus === 'Paid') return sum + (d.paidAmount !== undefined ? Number(d.paidAmount) : Number(d.amount || 0));
    if (pStatus === 'Partially Paid') return sum + (Number(d.paidAmount) || 0);
    return sum;
  }, 0);
  const totalPending = Math.max(0, totalPledged - totalPaid);
  const specialCount = sortedDonors.filter(d => d.isSpecialDonor).length;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    let rowsHtml = '';
    sortedDonors.forEach((d, idx) => {
      const isSpecial = d.isSpecialDonor;
      const isVerified = d.status === 'Verified' || d.receiptNo;
      const pStatus = d.paymentStatus || (isVerified ? 'Paid' : 'Unpaid');
      const promised = Number(d.amount) || 0;
      const paid = pStatus === 'Unpaid' ? 0 : (d.paidAmount !== undefined ? Number(d.paidAmount) : promised);

      let statusBadge = '';
      if (pStatus === 'Paid') statusBadge = '<span style="color: #059669; font-weight: bold;">Paid (జమయింది)</span>';
      else if (pStatus === 'Partially Paid') statusBadge = `<span style="color: #d97706; font-weight: bold;">Paid: ₹${paid} | Bal: ₹${promised - paid}</span>`;
      else statusBadge = `<span style="color: #dc2626; font-weight: bold;">Unpaid (బకాయి: ₹${promised})</span>`;

      rowsHtml += `
        <tr style="background-color: ${isSpecial ? '#fef3c7' : idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; font-weight: ${isSpecial ? 'bold' : 'normal'};">
          <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: center; font-family: monospace; font-weight: bold;">${d.receiptNo || 'PENDING'}</td>
          <td style="padding: 6px 8px; border: 1px solid #d1d5db;">
            ${isSpecial ? '★ [విశిష్ట దాత] ' : ''}${d.name || 'Donor'}
            ${d.specialContribution ? `<div style="font-size: 11px; color: #92400e;">సేవ: ${d.specialContribution}</div>` : ''}
            ${d.gotram ? `<div style="font-size: 11px; color: #6b7280;">గోత్రం: ${d.gotram}</div>` : ''}
          </td>
          <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: center;">${d.phone ? '+91 ' + d.phone : '-'}</td>
          <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; font-weight: bold; color: #b45309;">₹ ${promised.toLocaleString('en-IN')}</td>
          <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: center; font-size: 11px;">${statusBadge}</td>
        </tr>
      `;
    });

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${utsavTitle} - అధికారిక దాతల జాబితా లెడ్జర్</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; margin: 0; padding: 0; }
            .header { background: #7c2d12; color: #fef08a; text-align: center; padding: 16px; border-radius: 8px; margin-bottom: 14px; }
            .header h1 { margin: 0 0 4px; font-size: 20px; }
            .header p { margin: 0; font-size: 12px; color: #fed7aa; }
            .summary-box { display: flex; justify-content: space-between; margin-bottom: 12px; background: #fffbeb; border: 1px solid #fde68a; padding: 10px 14px; border-radius: 6px; font-size: 12px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #b45309; color: #ffffff; padding: 8px; border: 1px solid #92400e; text-align: center; font-size: 12px; }
            tfoot tr { background: #fef3c7; font-weight: bold; }
            tfoot td { padding: 10px; border: 1px solid #d1d5db; }
            .footer-note { margin-top: 14px; font-size: 10px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${utsavTitle}</h1>
            <p>OFFICIAL VERIFIED DONORS LEDGER • 2026</p>
          </div>

          <div class="summary-box">
            <span>మొత్తం హామీ విరాళాలు: <strong style="color: #92400e;">₹ ${totalPledged.toLocaleString('en-IN')}</strong></span>
            <span>వసూలైన మొత్తం: <strong style="color: #059669;">₹ ${totalPaid.toLocaleString('en-IN')}</strong></span>
            <span>రావలసిన బకాయి: <strong style="color: #dc2626;">₹ ${totalPending.toLocaleString('en-IN')}</strong></span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 35px;">#</th>
                <th style="width: 90px;">రశీదు నెం</th>
                <th>దాత పేరు & వివరాలు</th>
                <th style="width: 100px;">ఫోన్ నెం</th>
                <th style="width: 90px;">హామీ మొత్తం</th>
                <th style="width: 130px;">చెల్లింపు స్థితి</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="text-align: right;">మొత్తం హామీ (Pledged) / వసూలైన మొత్తం (Paid):</td>
                <td style="text-align: right; color: #b45309; font-size: 13px;">₹ ${totalPledged.toLocaleString('en-IN')}</td>
                <td style="text-align: center; color: #059669; font-size: 11px;">Paid: ₹ ${totalPaid.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>

          <div class="footer-note">
            Generated via Ganesha Diaries Cloud Portal • ${new Date().toLocaleString('en-IN')} • https://ganesha-chaturthi-utsav.onrender.com
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };

  const handleWhatsAppShare = () => {
    let msg = `🕉️ *${utsavTitle} - అధికారిక దాతల లెడ్జర్ 2026*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👥 మొత్తం దాతలు: *${sortedDonors.length} మంది*\n`;
    msg += `🌟 విశిష్ట దాతలు: *${specialCount} మంది*\n`;
    msg += `💰 మొత్తం సేకరించిన విరాళాలు: *₹ ${totalAmount.toLocaleString('en-IN')}* /-\n\n`;
    msg += `🏆 *టాప్ దాతల వివరాలు:*\n`;
    
    sortedDonors.slice(0, 10).forEach((d, idx) => {
      msg += `${idx + 1}. *${d.name}* - ₹ ${Number(d.amount).toLocaleString('en-IN')}\n`;
    });

    if (sortedDonors.length > 10) {
      msg += `... మరియు ఇంకా ${sortedDonors.length - 10} మంది భక్తులు.\n`;
    }

    msg += `\n🌐 పూర్తి లెడ్జర్ & డిజిటల్ రశీదులను ఇక్కడ చూడండి:\nhttps://ganesha-chaturthi-utsav.onrender.com\n`;
    msg += `గణపతి బప్పా మోరియా! 🙏🌺`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#240e06] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-[#381408] via-[#240e06] to-[#381408] border-b border-amber-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📜</span>
            <div>
              <h3 className="text-amber-200 font-bold text-base sm:text-lg leading-tight">
                అధికారిక దాతల జాబితా & లెడ్జర్ (Donors Ledger)
              </h3>
              <p className="text-amber-400/80 text-xs">
                మొత్తం హామీ: <span className="font-bold text-amber-200">₹ {totalPledged.toLocaleString('en-IN')}</span> • వసూలైనవి: <span className="font-bold text-emerald-400">₹ {totalPaid.toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full bg-amber-950/60 hover:bg-amber-900 border border-amber-500/30 text-amber-300 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Bar */}
        <div className="px-4 py-2.5 bg-[#1a0702] border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-amber-300 font-medium">✨ విశిష్ట దాతలు: <strong className="text-amber-100">{specialCount}</strong></span>
            <span className="text-emerald-400 font-medium">✅ వసూలైనవి: <strong>₹ {totalPaid.toLocaleString('en-IN')}</strong></span>
            <span className="text-rose-400 font-medium">⏳ బకాయి: <strong>₹ {totalPending.toLocaleString('en-IN')}</strong></span>
          </div>
          <span className="text-amber-300 font-bold bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/30">
            మొత్తం హామీ: ₹ {totalPledged.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-[#170502]/95 custom-scrollbar">
          <div className="overflow-x-auto rounded-2xl border border-amber-500/30">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-amber-700 to-amber-800 text-white font-bold text-center">
                  <th className="p-2.5 border-b border-amber-500/30 w-10">#</th>
                  <th className="p-2.5 border-b border-amber-500/30 w-24">రశీదు నెం</th>
                  <th className="p-2.5 border-b border-amber-500/30 text-left">దాత పేరు & వివరాలు</th>
                  <th className="p-2.5 border-b border-amber-500/30 w-24">ఫోన్ నెం</th>
                  <th className="p-2.5 border-b border-amber-500/30 text-right w-24">హామీ (₹)</th>
                  <th className="p-2.5 border-b border-amber-500/30 w-28">చెల్లింపు స్థితి</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/20">
                {sortedDonors.map((d, index) => {
                  const isSpecial = d.isSpecialDonor;
                  const isVerified = d.status === 'Verified' || d.receiptNo;
                  const pStatus = d.paymentStatus || (isVerified ? 'Paid' : 'Unpaid');
                  const promised = Number(d.amount) || 0;
                  const paid = pStatus === 'Unpaid' ? 0 : (d.paidAmount !== undefined ? Number(d.paidAmount) : promised);

                  return (
                    <tr 
                      key={d.id || index}
                      className={isSpecial ? "bg-amber-500/15 hover:bg-amber-500/25 transition-colors font-semibold" : "hover:bg-amber-950/30 transition-colors"}
                    >
                      <td className="p-2 text-center text-amber-400 font-mono">{index + 1}</td>
                      <td className="p-2 text-center font-mono text-amber-300 font-bold">{d.receiptNo || 'PENDING'}</td>
                      <td className="p-2 text-amber-100">
                        <div className="flex items-center gap-1.5">
                          {isSpecial && <span className="text-amber-400 text-sm">★</span>}
                          <span>{d.name || 'Donor'}</span>
                        </div>
                        {d.specialContribution && (
                          <p className="text-[10px] text-amber-400 font-normal">సేవ: {d.specialContribution}</p>
                        )}
                        {d.gotram && (
                          <p className="text-[10px] text-amber-300/60 font-normal">గోత్రం: {d.gotram}</p>
                        )}
                      </td>
                      <td className="p-2 text-center text-amber-300/80 font-mono">{d.phone ? `+91 ${d.phone}` : '-'}</td>
                      <td className="p-2 text-right font-bold text-amber-300 font-mono">₹ {promised.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-center text-[10px]">
                        {pStatus === 'Paid' && (
                          <span className="text-emerald-400 font-bold">✅ Paid</span>
                        )}
                        {pStatus === 'Partially Paid' && (
                          <span className="text-amber-300 font-bold">⚠️ జమ: ₹{paid}</span>
                        )}
                        {pStatus === 'Unpaid' && (
                          <span className="text-rose-400 font-bold">❌ బకాయి</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-[#200b05] border-t border-amber-500/30 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <p className="text-[11px] text-amber-300/70 hidden sm:block">
            ✨ 'Print / Save as PDF' నొక్కి మొత్తం రిపోర్ట్‌ను మీ ఫోన్‌లో PDF గా సేవ్ చేసుకోవచ్చు.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp సారాంశం 📱</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF ⎙</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
