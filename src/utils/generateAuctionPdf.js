import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates and downloads a high-quality PDF Report of the entire Laddu Auction
 * Accessible to all devotees and committee members.
 */
export const generateAuctionPdf = (auction, settings) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Top Border & Header Background
  doc.setFillColor(36, 14, 6); // Deep Temple Maroon
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold accent bar below header
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Header Text
  doc.setTextColor(254, 243, 199);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings?.utsavName || 'VIJAYA COLONY GANESHA YOUTH', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(251, 191, 36);
  doc.text('VINAYAKA CHAVITHI UTSAV 2026 • MAHA LADDU AUCTION REPORT', pageWidth / 2, 19, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(253, 230, 138);
  const printedDate = new Date().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Official Document • Generated on: ${printedDate}`, pageWidth / 2, 25, { align: 'center' });

  // 2. Laddu Item Specifications Box
  doc.setDrawColor(245, 158, 11);
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(14, 34, pageWidth - 28, 22, 3, 3, 'FD');

  doc.setTextColor(40, 15, 7);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Prasadam: ${auction?.itemTitleEnglish || auction?.itemTitle || 'Lord Ganesha Sacred Maha Laddu Prasadam'}`, 18, 41);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Weight: ${auction?.ladduWeight || '21 KG'} Pure Ghee`, 18, 47);
  doc.text(`Starting Base Bid: Rs. ${Number(auction?.startingBid || 5001).toLocaleString('en-IN')}`, 80, 47);
  doc.text(`Total Bids Placed: ${auction?.bidsCount || auction?.bidsHistory?.length || 0}`, 150, 47);
  doc.text(`Status: ${auction?.status === 'completed' ? 'Concluded (Winner Crowned)' : 'In Progress'}`, 18, 52);

  // 3. Grand Winner Spotlight Card (If completed or winner exists)
  let nextY = 62;
  if (auction?.winner && auction?.winner?.name) {
    doc.setFillColor(254, 240, 138); // Warm Gold
    doc.setDrawColor(217, 119, 6);
    doc.roundedRect(14, nextY, pageWidth - 28, 28, 4, 4, 'FD');

    doc.setTextColor(120, 53, 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('★ GRAND LADDU AUCTION WINNER (విజేత) ★', pageWidth / 2, nextY + 7, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(24, 8, 3);
    doc.text(auction.winner.name, pageWidth / 2, nextY + 14, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(`Winning Bid: Rs. ${Number(auction.winner.winningBid).toLocaleString('en-IN')} /-`, pageWidth / 2, nextY + 20, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(110, 40, 10);
    const winnerDate = new Date(auction.winner.declaredAt || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    doc.text(`Gotram: ${auction.winner.gotram || 'Shiva Gotram'} • Declared On: ${winnerDate}`, pageWidth / 2, nextY + 25, { align: 'center' });

    nextY += 34;
  }

  // 4. Complete Bids History Table
  const tableData = (auction?.bidsHistory && auction.bidsHistory.length > 0)
    ? auction.bidsHistory.map((bid, index) => [
        (auction.bidsHistory.length - index).toString(),
        bid.bidderName,
        bid.gotram || 'శివ గోత్రం',
        `Rs. ${Number(bid.amount).toLocaleString('en-IN')}`,
        new Date(bid.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      ])
    : [
        ['1', auction?.winner?.name || 'Winner', auction?.winner?.gotram || 'శివ గోత్రం', `Rs. ${Number(auction?.currentHighestBid || 5001).toLocaleString('en-IN')}`, 'Final']
      ];

  doc.autoTable({
    startY: nextY,
    head: [['#', 'Bidder Name (బిడ్డర్)', 'Gotram (గోత్రం)', 'Bid Amount (మొత్తం)', 'Timestamp (సమయం)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [36, 14, 6],
      textColor: [254, 243, 199],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 10, 5]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { fontStyle: 'bold', cellWidth: 60 },
      2: { cellWidth: 40 },
      3: { halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9], cellWidth: 38 },
      4: { halign: 'center', cellWidth: 32 }
    },
    alternateRowStyles: {
      fillColor: [254, 249, 235]
    },
    margin: { left: 14, right: 14 }
  });

  // 5. Footer & Blessings
  const finalY = doc.lastAutoTable?.finalY || nextY + 40;
  const footerY = Math.min(finalY + 12, pageHeight - 20);

  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.text('"Sarve Jana Sukhino Bhavantu • Sri Varasiddhi Vinayaka Swamy Divine Blessings"', pageWidth / 2, footerY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(40, 15, 7);
  doc.text('Vijaya Colony Ganesha Utsav Committee 2026 • Mandapam Office', pageWidth / 2, footerY + 5, { align: 'center' });

  // Download PDF
  const filename = `Vijaya_Colony_Ganesha_Laddu_Auction_Report_${Date.now()}.pdf`;
  doc.save(filename);
};
