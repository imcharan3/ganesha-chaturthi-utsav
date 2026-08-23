/**
 * Dynamic HTML5 Canvas Devotional Poster Generator for Laddu Auction Winner
 * Generates crystal clear 1080x1350px image for WhatsApp sharing & gallery download.
 */

export const generateAuctionPoster = async (winnerData, settings) => {
  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = 1350;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Royal Temple Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#280c05');
  bgGrad.addColorStop(0.3, '#1c0803');
  bgGrad.addColorStop(0.7, '#140502');
  bgGrad.addColorStop(1, '#2d0f06');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Spiritual Radial Glow Aura in Center
  const radialGlow = ctx.createRadialGradient(width / 2, height * 0.45, 50, width / 2, height * 0.45, 480);
  radialGlow.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
  radialGlow.addColorStop(0.5, 'rgba(217, 119, 6, 0.12)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // 3. Ornate Double Gold Borders
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 10;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.strokeRect(45, 45, width - 90, height - 90);

  // Corner Ornaments
  const drawCorner = (x, y) => {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCorner(55, 55);
  drawCorner(width - 55, 55);
  drawCorner(55, height - 55);
  drawCorner(width - 55, height - 55);

  // 4. Header Section: Devotional Invocation
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 30px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText('॥ శ్రీ వరసిద్ధి వినాయక ప్రసన్నః ॥', width / 2, 110);

  // Colony Emblem / Logo
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
      logoImg.src = '/colony_logo.jpg';
    });
    if (logoImg.complete && logoImg.naturalWidth !== 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, 200, 60, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logoImg, width / 2 - 60, 140, 120, 120);
      ctx.restore();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(width / 2, 200, 62, 0, Math.PI * 2);
      ctx.stroke();
    }
  } catch (e) {
    // Fallback if logo fails
  }

  // 5. Title & Organization
  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 44px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText(settings?.utsavName || 'విజయ కాలనీ గణేష్ యూత్', width / 2, 310);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '600 24px Outfit, sans-serif';
  ctx.fillText('VIJAYA COLONY • VINAYAKA CHAVITHI UTSAV 2026', width / 2, 350);

  // Decorative Horizontal Ribbon
  const ribbonGrad = ctx.createLinearGradient(120, 0, width - 120, 0);
  ribbonGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
  ribbonGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.9)');
  ribbonGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = ribbonGrad;
  ctx.fillRect(120, 380, width - 240, 4);

  // 6. Grand Event Badge
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 340, 415, 680, 65, 32);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const ladduWeight = winnerData?.ladduWeight || '21 KG';
  ctx.fillStyle = '#fffbeb';
  ctx.font = 'bold 28px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText(`🏆 ${ladduWeight} మహా లడ్డూ ప్రసాదం వేలం విజేత 🏆`, width / 2, 458);

  // 7. Winner Details Card Frame
  const cardY = 515;
  const cardW = width - 160;
  const cardH = 430;
  const cardX = 80;

  ctx.fillStyle = 'rgba(20, 6, 3, 0.85)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Winner Crown Icon / Title
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 24px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText('👑 లడ్డూ ప్రసాద విజేత (Grand Winner)', width / 2, cardY + 55);

  // Winner Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px "Noto Sans Telugu", Outfit, sans-serif';
  const winnerName = winnerData?.name || 'భక్తుడు';
  ctx.fillText(winnerName, width / 2, cardY + 135);

  // Gotram
  ctx.fillStyle = '#fde68a';
  ctx.font = '600 28px "Noto Sans Telugu", Outfit, sans-serif';
  const gotramText = `గోత్రం: ${winnerData?.gotram || 'శివ గోత్రం'}`;
  ctx.fillText(gotramText, width / 2, cardY + 185);

  // Winning Amount Golden Highlight Box
  const amountBoxY = cardY + 235;
  const amountBoxGrad = ctx.createLinearGradient(width / 2 - 250, 0, width / 2 + 250, 0);
  amountBoxGrad.addColorStop(0, '#b45309');
  amountBoxGrad.addColorStop(0.5, '#f59e0b');
  amountBoxGrad.addColorStop(1, '#b45309');
  ctx.fillStyle = amountBoxGrad;
  ctx.beginPath();
  ctx.roundRect(width / 2 - 270, amountBoxY, 540, 95, 20);
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#1c0803';
  ctx.font = 'bold 22px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText('గెలుచుకున్న వేలం మొత్తం (Winning Bid)', width / 2, amountBoxY + 33);

  ctx.fillStyle = '#170602';
  ctx.font = '900 48px Outfit, sans-serif';
  const amountFormatted = `₹ ${Number(winnerData?.winningBid || 0).toLocaleString('en-IN')} /-`;
  ctx.fillText(amountFormatted, width / 2, amountBoxY + 80);

  // 8. Devotional Blessing Quote
  ctx.fillStyle = '#fde68a';
  ctx.font = 'italic 24px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText('“సర్వేజనాః సుఖినోభవంతు - సమస్త సన్మంగళాని భవంతు”', width / 2, 1005);

  ctx.fillStyle = '#fed7aa';
  ctx.font = '20px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText('శ్రీ వరసిద్ధి వినాయక స్వామి అనుగ్రహం మీ కుటుంబంపై ఎల్లప్పుడూ ఉండుగాక!', width / 2, 1045);

  // 9. Footer & Date
  const dateStr = new Date(winnerData?.declaredAt || Date.now()).toLocaleDateString('te-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 22px "Noto Sans Telugu", Outfit, sans-serif';
  ctx.fillText(`తేదీ: ${dateStr} • విజయ కాలనీ గణేష్ ఉత్సవ కమిటీ 🚩`, width / 2, 1140);

  ctx.fillStyle = '#d97706';
  ctx.font = '16px Outfit, sans-serif';
  ctx.fillText('Official Portal: https://ganesha-chaturthi-utsav.onrender.com', width / 2, 1180);

  return canvas;
};

/**
 * Downloads the generated poster canvas as a high-res PNG
 */
export const downloadAuctionPoster = (canvas, filename = 'Vijaya_Colony_Ganesha_Laddu_Winner.png') => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Shares the poster on WhatsApp via Web Share API or direct WhatsApp link fallback
 */
export const shareAuctionPoster = async (canvas, winnerData, settings) => {
  const winnerName = winnerData?.name || 'మహా భక్తుడు';
  const amount = Number(winnerData?.winningBid || 0).toLocaleString('en-IN');
  const caption = `🌺 *శ్రీ వినాయక చవితి 2026 - మహా లడ్డూ వేలం పాట విజేత* 🌺\n\n🏆 *విజేత:* ${winnerName}\n🚩 *గోత్రం:* ${winnerData?.gotram || 'శివ గోత్రం'}\n💰 *గెలుచుకున్న మొత్తం:* ₹${amount}/-\n\nశ్రీ వరసిద్ధి వినాయక స్వామి అనుగ్రహం అందరిపై ఉండుగాక! 🙏🚩\n\n- *విజయ కాలనీ గణేష్ యూత్*\n🌐 https://ganesha-chaturthi-utsav.onrender.com/`;

  try {
    if (navigator.canShare) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'Ganesh_Laddu_Auction_Winner.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'మహా లడ్డూ వేలం విజేత',
            text: caption,
            files: [file]
          });
          return;
        }
      });
    }
  } catch (err) {
    console.log('Native file share skipped:', err);
  }

  // Direct WhatsApp share fallback
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`;
  window.open(whatsappUrl, '_blank');
  downloadAuctionPoster(canvas);
};
