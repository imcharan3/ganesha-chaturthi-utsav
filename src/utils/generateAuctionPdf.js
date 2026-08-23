import jsPDF from 'jspdf';

/**
 * Generates and downloads a high-definition, devotional A4 PDF report of the entire Laddu Auction
 * Supports full Telugu typography, royal borders, Winner Showcase, and complete Bids History.
 */
export const generateAuctionPdf = async (auction, settings) => {
  try {
    const canvas = document.createElement('canvas');
    const width = 1240;
    const minHeight = 1754; // A4 ratio (1240 x 1754)
    
    const bids = auction?.bidsHistory || [];
    // Dynamic height calculation if many bids exist
    const rowsCount = Math.max(bids.length, 1);
    const rowHeight = 46;
    const tableHeaderY = 620;
    const tableTotalHeight = 60 + (rowsCount * rowHeight);
    const requiredHeight = Math.max(minHeight, tableHeaderY + tableTotalHeight + 140);
    
    canvas.width = width;
    canvas.height = requiredHeight;
    const ctx = canvas.getContext('2d');

    // 1. Background Fill (Parchment Ivory with subtle gradient)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, requiredHeight);
    bgGrad.addColorStop(0, '#fefce8');
    bgGrad.addColorStop(0.5, '#fffbeb');
    bgGrad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, requiredHeight);

    // 2. Ornate Maroon & Gold Page Border
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, requiredHeight - 40);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(32, 32, width - 64, requiredHeight - 64);

    // 3. Royal Header Banner (Maroon)
    const headerH = 140;
    const headerGrad = ctx.createLinearGradient(0, 36, 0, 36 + headerH);
    headerGrad.addColorStop(0, '#381207');
    headerGrad.addColorStop(1, '#1e0803');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(36, 36, width - 72, headerH);

    // Header Golden Border Line
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(36, 36 + headerH, width - 72, 4);

    // Top Invocations
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 20px "Noto Sans Telugu", Outfit, sans-serif';
    ctx.fillText('॥ శ్రీ వరసిద్ధి వినాయక ప్రసన్నః • గణపతి బప్పా మోరియా ॥', width / 2, 70);

    // Colony Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Noto Sans Telugu", Outfit, sans-serif';
    ctx.fillText(settings?.utsavName || 'విజయ కాలనీ గణేష్ డైరీస్', width / 2, 115);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '600 18px Outfit, sans-serif';
    ctx.fillText('VINAYAKA CHAVITHI 2026 • VIJAYA COLONY GANESHA DIARIES REPORT', width / 2, 148);

    // 4. Laddu Specifications Summary Box
    const specsY = 195;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(50, specsY, width - 100, 100, 16);
    ctx.fill();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner Spec Columns
    ctx.textAlign = 'left';
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 20px "Noto Sans Telugu", Outfit, sans-serif';
    ctx.fillText(`ప్రసాదం: ${auction?.itemTitle || 'శ్రీ వినాయక మహా లడ్డూ ప్రసాదం'}`, 75, specsY + 38);

    ctx.font = '600 16px "Noto Sans Telugu", Outfit, sans-serif';
    ctx.fillStyle = '#451a03';
    ctx.fillText(`బరువు: ${auction?.ladduWeight || '21 KG'} (Pure Ghee)`, 75, specsY + 74);
    ctx.fillText(`ప్రారంభ ధర: ₹${Number(auction?.startingBid || 5001).toLocaleString('en-IN')}`, 420, specsY + 74);
    ctx.fillText(`మొత్తం బిడ్లు: ${bids.length}`, 760, specsY + 74);

    const statusText = auction?.status === 'completed' ? 'వేలం ముగిసింది (Concluded)' : 'ప్రక్రియలో ఉంది (In Progress)';
    ctx.fillText(`స్థితి: ${statusText}`, 940, specsY + 38);

    // 5. Grand Winner Showcase Card
    let nextY = specsY + 120;
    if (auction?.winner && auction?.winner?.name) {
      const winnerH = 150;
      const winnerGrad = ctx.createLinearGradient(0, nextY, 0, nextY + winnerH);
      winnerGrad.addColorStop(0, '#fef3c7');
      winnerGrad.addColorStop(1, '#fde68a');
      ctx.fillStyle = winnerGrad;
      ctx.beginPath();
      ctx.roundRect(50, nextY, width - 100, winnerH, 20);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 20px "Noto Sans Telugu", Outfit, sans-serif';
      ctx.fillText('👑 మహా లడ్డూ ప్రసాద విజేత (Grand Auction Winner) 👑', width / 2, nextY + 38);

      ctx.fillStyle = '#1e0803';
      ctx.font = 'bold 38px "Noto Sans Telugu", Outfit, sans-serif';
      ctx.fillText(auction.winner.name, width / 2, nextY + 84);

      ctx.fillStyle = '#78350f';
      ctx.font = '600 20px "Noto Sans Telugu", Outfit, sans-serif';
      const winnerGotram = auction.winner.gotram || 'శివ గోత్రం';
      const winnerAmount = Number(auction.winner.winningBid).toLocaleString('en-IN');
      ctx.fillText(`గోత్రం: ${winnerGotram}   |   గెలుచుకున్న మొత్తం: ₹${winnerAmount}/-`, width / 2, nextY + 122);

      nextY += winnerH + 25;
    }

    // 6. Complete Bids History Table
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 22px "Noto Sans Telugu", Outfit, sans-serif';
    ctx.fillText('📊 ప్రత్యక్ష వేలం పాట వివరాలు (Complete Bids History):', 50, nextY + 28);

    const tableTop = nextY + 45;
    const colX = [50, 130, 520, 830, 1050]; // S.No, Name, Gotram, Amount, Time
    const colW = [80, 390, 310, 220, 140];

    // Table Header Row
    ctx.fillStyle = '#381207';
    ctx.beginPath();
    ctx.roundRect(50, tableTop, width - 100, 48, 8);
    ctx.fill();

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 16px "Noto Sans Telugu", Outfit, sans-serif';
    ctx.fillText('#', colX[0] + 25, tableTop + 30);
    ctx.fillText('భక్తుని పేరు (Bidder Name)', colX[1] + 15, tableTop + 30);
    ctx.fillText('గోత్రం (Gotram)', colX[2] + 15, tableTop + 30);
    ctx.fillText('బిడ్ మొత్తం (Amount)', colX[3] + 15, tableTop + 30);
    ctx.fillText('సమయం (Time)', colX[4] + 10, tableTop + 30);

    // Table Body Rows
    let curY = tableTop + 48;
    if (bids.length === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(50, curY, width - 100, 50);
      ctx.strokeStyle = '#e5e7eb';
      ctx.strokeRect(50, curY, width - 100, 50);

      ctx.fillStyle = '#6b7280';
      ctx.font = '16px "Noto Sans Telugu", Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('వేలం వివరాలు నమోదు కాలేదు (No bids recorded).', width / 2, curY + 32);
      curY += 50;
    } else {
      bids.forEach((bid, idx) => {
        const isHighest = idx === 0;
        ctx.fillStyle = isHighest ? '#fef3c7' : (idx % 2 === 0 ? '#ffffff' : '#f9fafb');
        ctx.fillRect(50, curY, width - 100, rowHeight);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(50, curY, width - 100, rowHeight);

        // Row Text
        ctx.textAlign = 'left';
        ctx.fillStyle = isHighest ? '#92400e' : '#1f2937';
        ctx.font = isHighest ? 'bold 16px Outfit, sans-serif' : '15px Outfit, sans-serif';
        ctx.fillText(`#${bids.length - idx}`, colX[0] + 20, curY + 29);

        ctx.font = isHighest ? 'bold 17px "Noto Sans Telugu", Outfit, sans-serif' : '16px "Noto Sans Telugu", Outfit, sans-serif';
        ctx.fillText(bid.bidderName, colX[1] + 15, curY + 29);

        ctx.font = '15px "Noto Sans Telugu", Outfit, sans-serif';
        ctx.fillStyle = '#4b5563';
        ctx.fillText(bid.gotram || 'శివ గోత్రం', colX[2] + 15, curY + 29);

        ctx.font = 'bold 17px Outfit, sans-serif';
        ctx.fillStyle = isHighest ? '#b45309' : '#047857';
        ctx.fillText(`₹ ${Number(bid.amount).toLocaleString('en-IN')}`, colX[3] + 15, curY + 29);

        ctx.font = '14px Outfit, sans-serif';
        ctx.fillStyle = '#6b7280';
        const timeStr = new Date(bid.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        ctx.fillText(timeStr, colX[4] + 10, curY + 29);

        curY += rowHeight;
      });
    }

    // 7. Footer & Blessings
    const footerY = requiredHeight - 75;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#78350f';
    ctx.font = 'italic 18px "Noto Sans Telugu", Outfit, sans-serif';
    ctx.fillText('“సర్వేజనాః సుఖినోభవంతు • శ్రీ వరసిద్ధి వినాయక స్వామి దివ్య అనుగ్రహం మీ కుటుంబంపై ఉండుగాక”', width / 2, footerY);

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 15px "Noto Sans Telugu", Outfit, sans-serif';
    const genDate = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    ctx.fillText(`తేదీ: ${genDate} • విజయ కాలనీ గణేష్ డైరీస్ 2026 🚩 (Instagram: @vijayacolony_ganesha_diaries)`, width / 2, footerY + 30);

    // 8. Convert High-Res Canvas into PDF using jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Handle single or multi-page A4
    if (pdfHeight <= 297) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    } else {
      // If height exceeds 1 page, slice or fit neatly
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, 297);
    }

    const filename = `Vijaya_Colony_Ganesha_Laddu_Auction_Report_${Date.now()}.pdf`;
    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Error generating PDF report:', err);
    throw err;
  }
};
