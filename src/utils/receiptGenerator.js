import { jsPDF } from 'jspdf';

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

  // 5. Colony Logo
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
      logoImg.src = '/colony_logo.png';
    });

    if (logoImg.complete && logoImg.naturalWidth !== 0) {
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
  renderFieldRow('గోత్రం', 'Gotram', donor?.gotram || 'శివ గోత్రం');
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
 * Download Devotional Receipt as PNG
 */
export const downloadDonorReceiptPng = async (donor, settings) => {
  try {
    const canvas = await generateDonorReceiptCanvas(donor, settings);
    const downloadLink = document.createElement('a');
    const safeName = (donor.name || 'Donor').replace(/\s+/g, '_');
    const receiptNo = donor.receiptNo || 'REC';
    downloadLink.download = `Ganesha_Receipt_${receiptNo}_${safeName}.png`;
    downloadLink.href = canvas.toDataURL('image/png', 1.0);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    return true;
  } catch (err) {
    console.error('Error downloading PNG receipt:', err);
    throw err;
  }
};

/**
 * Download Official Devotional Receipt as PDF
 */
export const downloadDonorReceiptPdf = async (donor, settings) => {
  try {
    const canvas = await generateDonorReceiptCanvas(donor, settings);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    const safeName = (donor.name || 'Donor').replace(/\s+/g, '_');
    const receiptNo = donor.receiptNo || 'REC';
    pdf.save(`Ganesha_Receipt_${receiptNo}_${safeName}.pdf`);
    return true;
  } catch (err) {
    console.error('Error downloading PDF receipt:', err);
    throw err;
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
  const gotramStr = donor?.gotram || 'శివ గోత్రం';
  const donorName = donor?.name || 'భక్తుడు';

  return `🚩 *శ్రీ వరసిద్ధి వినాయక సేవా సమితి* 🚩
*${utsavName} 2026*
*అధికారిక విరాళ రశీదు & దివ్య ఆశీస్సులు*
----------------------------------------
🧾 *రశీదు సంఖ్య (Receipt No):* ${receiptNo}
👤 *దాత పేరు (Donor Name):* ${donorName}
🌺 *గోత్రం (Gotram):* ${gotramStr}
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
 * Convert Canvas to PNG Blob
 */
export const generateDonorReceiptBlob = async (donor, settings) => {
  const canvas = await generateDonorReceiptCanvas(donor, settings);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
};

/**
 * Share Devotional Receipt with Attached PNG Image and Message
 * On mobile/PWA: Uses Web Share API to attach the PNG image directly to WhatsApp/Share sheet!
 * On desktop fallback: Downloads PNG image and opens WhatsApp chat with text.
 */
export const shareDonorReceiptWithImage = async (donor, settings) => {
  const text = getWhatsAppReceiptText(donor, settings);
  const safeName = (donor.name || 'Donor').replace(/\s+/g, '_');
  const receiptNo = donor.receiptNo || 'REC';
  const fileName = `Ganesha_Receipt_${receiptNo}_${safeName}.png`;

  try {
    const blob = await generateDonorReceiptBlob(donor, settings);
    if (!blob) throw new Error('Failed to generate image blob');

    const file = new File([blob], fileName, { type: 'image/png' });

    // Check if Web Share API with files is supported (Mobile Chrome, Safari, Android WebViews)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'శ్రీ వినాయక చవితి అధికారిక విరాళ రశీదు',
        text: text,
        files: [file]
      });
      return { success: true, method: 'web-share' };
    }
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, cancelled: true };
    console.warn('Web share with image failed or not supported, falling back:', err);
  }

  // Fallback for desktop & browsers without File Share support:
  // 1. Download the PNG receipt image to Downloads folder
  await downloadDonorReceiptPng(donor, settings);

  // 2. Open WhatsApp chat with prefilled text
  sendWhatsAppReceipt(donor, settings);

  return { success: true, method: 'download-and-whatsapp' };
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
