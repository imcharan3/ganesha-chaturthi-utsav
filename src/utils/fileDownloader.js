import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const downloadPdf = async (pdf, filename = 'document.pdf') => {
  if (!pdf) return false;
  try {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      const dataUri = pdf.output('datauristring');
      const base64Data = dataUri.split(',')[1] || dataUri;
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache
      });
      try {
        await Share.share({
          title: filename,
          text: 'విజయ కాలనీ గణేష్ డైరీస్ PDF డాక్యుమెంట్',
          url: savedFile.uri,
          dialogTitle: 'ఓపెన్ లేదా సేవ్ చేయండి: ' + filename
        });
      } catch (shareErr) {
        console.warn('Share prompt skipped:', shareErr);
      }
      return true;
    } else {
      pdf.save(filename);
      return true;
    }
  } catch (err) {
    console.error('Error in downloadPdf:', err);
    try { pdf.save(filename); } catch (e) {}
    return false;
  }
};

export const downloadCanvasImage = async (canvas, filename = 'image.png') => {
  if (!canvas) return false;
  try {
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      const base64Data = dataUrl.split(',')[1] || dataUrl;
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache
      });
      try {
        await Share.share({
          title: filename,
          text: 'విజయ కాలనీ గణేష్ డైరీస్ ఫోటో / పోస్టర్',
          url: savedFile.uri,
          dialogTitle: 'ఓపెన్ లేదా సేవ్ చేయండి: ' + filename
        });
      } catch (shareErr) {
        console.warn('Share prompt dismissed:', shareErr);
      }
      return true;
    } else {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
  } catch (err) {
    console.error('Error in downloadCanvasImage:', err);
    return false;
  }
};