import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadPdf, downloadCanvasImage } from './fileDownloader';

/**
 * Generate a high-resolution, divine Devotional Receipt Canvas
 */
export const generateDonorReceiptCanvas = async (donor, settings) => {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 1650;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  // 1. Auspicious Temple Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#2b0c05');
  bgGrad.addColorStop(0.3, '#1c0803');
  bgGrad.addColorStop(0.7, '#130502');
  bgGrad.addColorStop(1, '#2c0f06');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Divine Golden Radial Glow
  const radialGlow = ctx.createRadialGradient(width / 2, 520, 60, width / 2, 520, 560);
  radialGlow.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
  radialGlow.addColorStop(0.5, 'rgba(217, 119, 6, 0.10)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // 3. Ornate Double Golden Border
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 12;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.strokeRect(46, 46, width - 92, height - 92);

  // Decorative Corner Dots
  const drawCornerDot = (x, y) => {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  drawCornerDot(58, 58);
  drawCornerDot(width - 58, 58);
  drawCornerDot(58, height - 58);
  drawCornerDot(width - 58, height - 58);

  // 4. Sacred Top Invocations
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 28px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText('॥ శ్రీ వరసిద్ధి వినాయక ప్రసన్నః • గణపతి బప్పా మోరియా ॥', width / 2, 115);

  // 5. Colony Logo (Safe load with timeout)
  try {
    const logoImg = new Image();
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 600);
      logoImg.onload = () => { clearTimeout(timer); resolve(); };
      logoImg.onerror = () => { clearTimeout(timer); resolve(); };
      logoImg.src = '/colony_logo.png';
    });

    if (logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, 215, 65, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logoImg, width / 2 - 65, 150, 130, 130);
      ctx.restore();

      // Logo Gold Rim
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(width / 2, 215, 68, 0, Math.PI * 2);
      ctx.stroke();
    }
  } catch (e) {
    console.warn('Logo load error for receipt:', e);
  }

  // 6. Mandapam Title & Header
  ctx.fillStyle = '#fffbeb';
  ctx.font = 'bold 44px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText(settings?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్', width / 2, 330);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '600 22px Outfit, sans-serif';
  ctx.fillText('VIJAYA COLONY GANESHA DIARIES • VINAYAKA CHAVITHI 2026', width / 2, 370);

  // Decorative Divider Line
  const divGrad = ctx.createLinearGradient(120, 0, width - 120, 0);
  divGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
  divGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.9)');
  divGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = divGrad;
  ctx.fillRect(120, 395, width - 240, 3);

  // 7. Official Receipt Banner Ribbon
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 400, 420, 800, 56, 28);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#fffbeb';
  ctx.font = 'bold 24px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText('🧾 అధికారిక విరాళ రశీదు • OFFICIAL DONATION RECEIPT', width / 2, 456);

  // 8. Main Devotional Receipt Information Card
  const cardX = 80;
  const cardY = 505;
  const cardW = width - 160;
  const cardH = 580;

  ctx.fillStyle = 'rgba(20, 6, 3, 0.88)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Receipt Header Strip inside Card
  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, 70, [24, 24, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Receipt No & Date
  const receiptNo = donor?.receiptNo || `VCGD-REC-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date(donor?.verifiedAt || donor?.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = new Date(donor?.verifiedAt || donor?.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  ctx.textAlign = 'left';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 20px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText(`రశీదు నెం: ${receiptNo}`, cardX + 30, cardY + 44);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#fde68a';
  ctx.font = '600 18px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText(`తేదీ: ${dateStr}, ${timeStr}`, cardX + cardW - 30, cardY + 44);

  // Field Rows
  let curY = cardY + 120;
  const rowGap = 52;
  const leftX = cardX + 35;
  const valX = cardX + 360;

  const renderFieldRow = (labelTelugu, labelEnglish, value, isHighlight = false) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 20px "Noto Sans Telugu", Outfit, sans-serif';
    ctx.fillText(`${labelTelugu} (${labelEnglish}):`, leftX, curY);

    ctx.fillStyle = isHighlight ? '#ffffff' : '#fef3c7';
    ctx.font = isHighlight ? 'bold 26px "Noto Sans Telugu", Outfit, sans-serif' : '20px "Noto Sans Telugu", Outfit, sans-serif';
    ctx.fillText(value, valX, curY);

    // subtle line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX, curY + 14);
    ctx.lineTo(cardX + cardW - 35, curY + 14);
    ctx.stroke();

    curY += rowGap;
  };

  renderFieldRow('దాత పేరు', 'Donor Name', donor?.name || 'భక్తుడు', true);

  if (donor?.isSpecialDonor) {
    renderFieldRow('విశిష్ట దాత సేవ', 'Special Contribution', donor.specialContribution || 'విశిష్ట విరాళ సేవ', true);
  }

  renderFieldRow('మొబైల్ నంబర్', 'Mobile Phone', donor?.phone ? `+91 ${donor.phone}` : 'Recorded on Portal');
  renderFieldRow('చెల్లింపు విధానం', 'Payment Mode', `${donor?.paymentMode || 'UPI'} (${donor?.referenceNo || 'REF-VERIFIED'})`);
  renderFieldRow('ధృవీకరణ స్థితి', 'Status', 'అడ్మిన్ ధృవీకరించబడింది (Verified & Blessed ✅)');

  if (donor?.message) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px "Noto Sans Telugu", Outfit, sans-serif';
    ctx.fillText('భక్తి ప్రార్థన (Devotional Message):', leftX, curY);
    ctx.fillStyle = '#fed7aa';
    ctx.font = 'italic 18px "Noto Sans Telugu", Outfit, sans-serif';
    ctx.fillText(`"${donor.message.slice(0, 55)}${donor.message.length > 55 ? '...' : ''}"`, leftX + 320, curY);
    curY += rowGap;
  }

  // 9. Golden Amount Display Box
  const amtBoxY = 1115;
  const amtGrad = ctx.createLinearGradient(width / 2 - 380, 0, width / 2 + 380, 0);
  amtGrad.addColorStop(0, '#92400e');
  amtGrad.addColorStop(0.5, '#f59e0b');
  amtGrad.addColorStop(1, '#92400e');

  ctx.fillStyle = amtGrad;
  ctx.beginPath();
  ctx.roundRect(width / 2 - 400, amtBoxY, 800, 115, 24);
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1c0803';
  ctx.font = 'bold 22px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText('సమర్పించిన పవిత్ర విరాళం (Donation Amount)', width / 2, amtBoxY + 38);

  ctx.fillStyle = '#120401';
  ctx.font = '900 52px Outfit, sans-serif';
  ctx.fillText(`₹ ${Number(donor?.amount || 0).toLocaleString('en-IN')} /-`, width / 2, amtBoxY + 92);

  // 10. Sacred Shloka & Blessings
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'italic bold 24px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText('“సర్వేజనాః సుఖినోభవంతు - సమస్త సన్మంగళాని భవంతు”', width / 2, 1285);

  ctx.fillStyle = '#fed7aa';
  ctx.font = '22px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText('శ్రీ వరసిద్ధి వినాయక స్వామి దివ్య కృపాకటాక్షాలు మీ కుటుంబంపై ఎల్లప్పుడూ ఉండుగాక!', width / 2, 1325);

  // 11. Official Seal & Authority Sign
  const sealY = 1390;
  ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 350, sealY, 700, 60, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 20px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText('🚩 విజయ కాలనీ గణేష్ ఉత్సవ కమిటీ • Authorized Digital Receipt 🚩', width / 2, sealY + 38);

  // 12. Footer Links & Instagram
  ctx.fillStyle = '#f43f5e';
  ctx.font = 'bold 18px Outfit, sans-serif';
  ctx.fillText('📸 Instagram: @vijayacolony_ganesha_diaries', width / 2, 1495);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '16px Outfit, sans-serif';
  ctx.fillText('Official Portal: https://ganesha-chaturthi-utsav.onrender.com', width / 2, 1530);

  ctx.fillStyle = '#d97706';
  ctx.font = '14px Outfit, sans-serif';
  ctx.fillText('Generated & Verified via Ganesha Diaries Cloud Ledger', width / 2, 1560);

  return canvas;
};

/**
 * Download Devotional Receipt as PNG & Open In-App Preview
 */
export const downloadDonorReceiptPng = async (donor, settings) => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-receipt-preview-modal', {
        detail: { donor, settings }
      }));
    }
    const canvas = await generateDonorReceiptCanvas(donor, settings);
    const safeName = (donor.name || 'Donor').replace(/\s+/g, '_');
    const receiptNo = donor.receiptNo || 'REC';
    const filename = `Ganesha_Receipt_${receiptNo}_${safeName}.png`;
    return await downloadCanvasImage(canvas, filename);
  } catch (err) {
    console.error('Error downloading PNG receipt:', err);
    return false;
  }
};

/**
 * Download Official Devotional Receipt as PDF & Open In-App Preview
 */
export const downloadDonorReceiptPdf = async (donor, settings) => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-receipt-preview-modal', {
        detail: { donor, settings }
      }));
    }
    const canvas = await generateDonorReceiptCanvas(donor, settings);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    const safeName = (donor.name || 'Donor').replace(/\s+/g, '_');
    const receiptNo = donor.receiptNo || 'REC';
    const filename = `Ganesha_Receipt_${receiptNo}_${safeName}.pdf`;
    return await downloadPdf(pdf, filename);
  } catch (err) {
    console.error('Error downloading PDF receipt:', err);
    return false;
  }
};

/**
 * Generate formatted WhatsApp receipt message text
 */
export const getWhatsAppReceiptText = (donor, settings) => {
  const utsavName = settings?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్';
  const receiptNo = donor?.receiptNo || `VCGD-REC-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date(donor?.verifiedAt || donor?.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = new Date(donor?.verifiedAt || donor?.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const amountStr = Number(donor?.amount || 0).toLocaleString('en-IN');
  const donorName = donor?.name || 'భక్తుడు';

  let specialDonorSection = '';
  if (donor?.isSpecialDonor && donor?.specialContribution) {
    specialDonorSection = `\n🌟 *విశిష్ట దాత సేవ (Special Contribution):* ${donor.specialContribution}\n`;
  }

  return `🚩 *శ్రీ వరసిద్ధి వినాయక సేవా సమితి* 🚩
*${utsavName} 2026*
*అధికారిక విరాళ రశీదు & దివ్య ఆశీస్సులు*
----------------------------------------
🧾 *రశీదు సంఖ్య (Receipt No):* ${receiptNo}
👤 *దాత పేరు (Donor Name):* ${donorName}${specialDonorSection}
💰 *సమర్పించిన విరాళం:* ₹${amountStr} /-
💳 *చెల్లింపు విధానం:* ${donor?.paymentMode || 'UPI'} (${donor?.referenceNo || 'VERIFIED'})
📅 *తేదీ & సమయం:* ${dateStr}, ${timeStr}
✅ *స్థితి:* అడ్మిన్ ధృవీకరించబడింది (Verified & Blessed)
----------------------------------------
🙏 *“సర్వేజనాః సుఖినోభవంతు - సమస్త సన్మంగళాని భవంతు”*
శ్రీ వినాయక స్వామి దివ్య కృపాకటాక్షాలు, ఆయురారోగ్య ఐశ్వర్యాలు మీ కుటుంబంపై ఎల్లప్పుడూ ఉండుగాక!

📸 *తాజా అప్‌డేట్స్ కోసం ఇన్‌స్టాగ్రామ్ పేజీని ఫాలో అవ్వండి:*
https://instagram.com/vijayacolony_ganesha_diaries

🌐 *అధికారిక మండపం పోర్టల్:*
https://ganesha-chaturthi-utsav.onrender.com/`;
};

/**
 * Open WhatsApp with prefilled devotional receipt text directly to donor's phone
 */
export const sendWhatsAppReceipt = (donor, settings) => {
  const text = getWhatsAppReceiptText(donor, settings);
  let rawPhone = (donor?.phone || '').replace(/\D/g, '');

  if (rawPhone) {
    if (rawPhone.length === 10) rawPhone = '91' + rawPhone;
    const url = `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  } else {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }
};

/**
 * Download Complete Donors List PDF (Verified Donors Only, Special Donors at Top, Clickable Screenshot Links)
 */
export const downloadDonorsLedgerPdf = async (donors = [], settings = {}) => {
  try {
    // 1. Filter ONLY VERIFIED DONORS
    const verifiedDonors = donors.filter(d => d.status === 'Verified' || d.receiptNo);

    if (verifiedDonors.length === 0) {
      alert('No verified donors found to generate PDF report.');
      return false;
    }

    // 2. Sort: Special Donors first, then descending by amount
    const sortedDonors = [...verifiedDonors].sort((a, b) => {
      if (a.isSpecialDonor && !b.isSpecialDonor) return -1;
      if (!a.isSpecialDonor && b.isSpecialDonor) return 1;
      return (Number(b.amount) || 0) - (Number(a.amount) || 0);
    });

    const totalVerifiedSum = sortedDonors.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const specialDonorsCount = sortedDonors.filter(d => d.isSpecialDonor).length;

    // 3. Initialize PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const utsavTitle = settings?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్';

    // Header Banner
    pdf.setFillColor(124, 45, 18); // Crimson Deep
    pdf.rect(0, 0, 595.28, 75, 'F');

    pdf.setTextColor(254, 240, 138);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(utsavTitle, 297.64, 28, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('OFFICIAL VERIFIED DONORS LEDGER • 2026', 297.64, 45, { align: 'center' });

    pdf.setFontSize(8);
    pdf.setTextColor(254, 215, 170);
    pdf.text(`Total Verified Donors: ${sortedDonors.length}  |  Special Donors: ${specialDonorsCount}  |  Total Amount: Rs. ${totalVerifiedSum.toLocaleString('en-IN')}`, 297.64, 62, { align: 'center' });

    // Table Data preparation
    const tableColumns = [
      { header: '#', dataKey: 'sno' },
      { header: 'Receipt No', dataKey: 'receiptNo' },
      { header: 'Donor Name & Details', dataKey: 'donorDetails' },
      { header: 'Phone', dataKey: 'phone' },
      { header: 'Amount (Rs)', dataKey: 'amount' },
      { header: 'Mode / UTR', dataKey: 'mode' },
      { header: 'Screenshot Proof', dataKey: 'screenshot' }
    ];

    const tableRows = sortedDonors.map((d, index) => {
      let donorNameText = d.name || 'Donor';
      if (d.isSpecialDonor) {
        donorNameText = `★ [SPECIAL DONOR] ${d.name}` + (d.specialContribution ? `\nContrib: ${d.specialContribution}` : '');
      }

      const origin = (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) 
        ? window.location.origin 
        : 'https://ganesha-chaturthi-utsav.onrender.com';
      
      const fullProofUrl = d.receiptUrl ? `${origin}/api/donors/${d.id}/proof` : '';

      return {
        sno: index + 1,
        receiptNo: d.receiptNo || `REC-${index + 1001}`,
        donorDetails: donorNameText,
        phone: d.phone ? `+91 ${d.phone}` : '-',
        amount: `Rs. ${Number(d.amount).toLocaleString('en-IN')}`,
        mode: `${d.paymentMode || 'UPI'}\n${d.referenceNo || 'VERIFIED'}`,
        screenshot: fullProofUrl ? 'View Proof 🔗' : 'No Proof',
        receiptUrl: fullProofUrl,
        isSpecial: d.isSpecialDonor
      };
    });

    // AutoTable Generation
    autoTable(pdf, {
      startY: 85,
      columns: tableColumns,
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 4.5,
        valign: 'middle',
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [180, 83, 9], // Gold Amber
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        sno: { cellWidth: 22, halign: 'center' },
        receiptNo: { cellWidth: 70, halign: 'center', fontStyle: 'bold' },
        donorDetails: { cellWidth: 150 },
        phone: { cellWidth: 75, halign: 'center' },
        amount: { cellWidth: 70, halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] },
        mode: { cellWidth: 75, halign: 'center', fontSize: 7 },
        screenshot: { cellWidth: 75, halign: 'center', textColor: [29, 78, 216], fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        // Highlight Special Donor Rows in light amber
        const rowRaw = data.row.raw;
        if (rowRaw && rowRaw.isSpecial && data.section === 'body') {
          data.cell.styles.fillColor = [254, 243, 199]; // Light Gold
          if (data.column.dataKey === 'donorDetails') {
            data.cell.styles.textColor = [120, 53, 15]; // Deep Amber
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawCell: function(data) {
        // Attach active clickable PDF Link to the screenshot cell
        if (data.column.dataKey === 'screenshot' && data.section === 'body') {
          const rowRaw = data.row.raw;
          if (rowRaw && rowRaw.receiptUrl) {
            pdf.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, {
              url: rowRaw.receiptUrl
            });
          }
        }
      },
      foot: [
        [
          { content: 'GRAND TOTAL VERIFIED DONATIONS (మొత్తం విరాళాలు):', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 9, fillColor: [245, 230, 211], textColor: [120, 53, 15] } },
          { content: `Rs. ${totalVerifiedSum.toLocaleString('en-IN')}/-`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 9.5, textColor: [180, 83, 9], fillColor: [245, 230, 211] } },
          { content: `${sortedDonors.length} Donors (${specialDonorsCount} Special)`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8, fillColor: [245, 230, 211], textColor: [80, 40, 10] } }
        ]
      ],
      margin: { top: 85, left: 20, right: 20, bottom: 35 },
      didDrawPage: function(data) {
        // Footer
        pdf.setFontSize(7.5);
        pdf.setTextColor(120, 53, 15);
        pdf.text(
          `Official Ledger • Generated on ${new Date().toLocaleString('en-IN')} | Total: Rs. ${totalVerifiedSum.toLocaleString('en-IN')} | Page ${data.pageNumber}`,
          297.64,
          pdf.internal.pageSize.height - 15,
          { align: 'center' }
        );
      }
    });

    // Save PDF
    const filename = `Vijaya_Colony_Verified_Donors_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`;
    return await downloadPdf(pdf, filename);
  } catch (err) {
    console.error('Error generating Donors Ledger PDF:', err);
    alert('Failed to generate Donors List PDF: ' + err.message);
    return false;
  }
};
