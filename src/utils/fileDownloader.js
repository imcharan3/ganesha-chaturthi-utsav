import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Universal PDF Saver and Downloader
 * Safely writes PDF to device storage without exiting or crashing the app
 */
export const downloadPdf = async (pdf, filename = 'document.pdf') => {
  if (!pdf) return false;
  try {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      const dataUri = pdf.output('datauristring');
      const base64Data = dataUri.split(',')[1] || dataUri;

      try {
        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });
      } catch (fsErr) {
        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('devotional-toast-alert', {
          detail: {
            id: 'pdf-' + Date.now(),
            title: '📄 PDF డౌన్‌లోడ్ పూర్తయింది!',
            body: filename + ' మీ ఫోన్ Documents లో సేవ్ చేయబడింది.',
            icon: '📄',
            timestamp: new Date().toISOString()
          }
        }));
      }

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: '📄 PDF డౌన్‌లోడ్ పూర్తయింది',
              body: filename + ' సేవ్ చేయబడింది. ఓపెన్ చేయడానికి క్లిక్ చేయండి.',
              id: Math.floor(Math.random() * 1000000),
              schedule: { at: new Date(Date.now() + 100) },
              channelId: 'ganesh_devotional_alerts',
              smallIcon: 'ic_launcher'
            }
          ]
        });
      } catch (notifErr) {}

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

/**
 * Universal Canvas / Image Saver and Downloader
 */
export const downloadCanvasImage = async (canvas, filename = 'image.png') => {
  if (!canvas) return false;
  try {
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      const base64Data = dataUrl.split(',')[1] || dataUrl;
      try {
        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });
      } catch (fsErr) {
        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('devotional-toast-alert', {
          detail: {
            id: 'img-' + Date.now(),
            title: '🖼️ ఫోటో డౌన్‌లోడ్ పూర్తయింది!',
            body: filename + ' మీ ఫోన్‌లో సేవ్ చేయబడింది.',
            icon: '🖼️',
            timestamp: new Date().toISOString()
          }
        }));
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