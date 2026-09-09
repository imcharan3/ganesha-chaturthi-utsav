export const BACKEND_BASE_URL = (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173')
  ? ''
  : 'https://ganesha-chaturthi-utsav.onrender.com';

const API_BASE = `${BACKEND_BASE_URL}/api`;

export const api = {
  // Push Notifications
  registerPushToken: async (tokenData) => {
    try {
      const payload = typeof tokenData === 'string' ? { token: tokenData } : tokenData;
      const res = await fetch(`${API_BASE}/notifications/register-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      console.warn('Failed to register push token:', e);
      return null;
    }
  },

  // App Version & Updates
  getAppVersion: async () => {
    try {
      const res = await fetch(`${API_BASE}/app/version`);
      if (!res.ok) throw new Error('Failed to fetch version');
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  updateSettings: async (settings, token) => {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Admin Auth
  adminLogin: async (pin) => {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  // Donors
  getDonors: async () => {
    const res = await fetch(`${API_BASE}/donors`);
    if (!res.ok) throw new Error('Failed to fetch donors');
    return res.json();
  },

  createDonor: async (donorData) => {
    const res = await fetch(`${API_BASE}/donors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donorData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit donation');
    return data;
  },

  updateDonor: async (id, donorData, token) => {
    const res = await fetch(`${API_BASE}/admin/donors/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(donorData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update donor');
    return data;
  },

  verifyDonor: async (id, token) => {
    const res = await fetch(`${API_BASE}/admin/donors/${id}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify donor');
    return data;
  },

  deleteDonor: async (id, token) => {
    const res = await fetch(`${API_BASE}/admin/donors/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete donor');
    return data;
  },

  // Events
  getEvents: async () => {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  updateEvent: async (id, eventData, token) => {
    const res = await fetch(`${API_BASE}/admin/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update event');
    return data;
  },

  // Live Laddu Auction
  getAuction: async () => {
    const res = await fetch(`${API_BASE}/auction`);
    if (!res.ok) throw new Error('Failed to fetch auction details');
    return res.json();
  },

  updateAuctionStatus: async (statusData, token) => {
    const res = await fetch(`${API_BASE}/admin/auction/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(statusData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update auction status');
    return data;
  },

  addAuctionBidder: async (bidderData, token) => {
    const res = await fetch(`${API_BASE}/admin/auction/bidders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bidderData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add bidder');
    return data;
  },

  updateAuctionBidder: async (bidderId, bidderData, token) => {
    const res = await fetch(`${API_BASE}/admin/auction/bidders/${bidderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bidderData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update bidder');
    return data;
  },

  deleteAuctionBidder: async (bidderId, token) => {
    const res = await fetch(`${API_BASE}/admin/auction/bidders/${bidderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete bidder');
    return data;
  },

  placeAuctionBid: async (bidData, token) => {
    const res = await fetch(`${API_BASE}/admin/auction/bid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bidData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place bid');
    return data;
  },

  undoAuctionBid: async (token) => {
    const res = await fetch(`${API_BASE}/admin/auction/undo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to undo bid');
    return data;
  },

  declareAuctionWinner: async (winnerData, token) => {
    const res = await fetch(`${API_BASE}/admin/auction/winner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(winnerData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to declare winner');
    return data;
  },

  resetAuction: async (startingBid, token) => {
    const res = await fetch(`${API_BASE}/admin/auction/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ startingBid })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset auction');
    return data;
  },

  // Messages
  getMessages: async () => {
    const res = await fetch(`${API_BASE}/messages`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  sendMessage: async (messageData) => {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send message');
    return data;
  },

  reactToMessage: async (id, emoji) => {
    const res = await fetch(`${API_BASE}/messages/${id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to react');
    return data;
  },

  deleteMessage: async (id, options = {}) => {
    const headers = {};
    if (typeof options === 'string') {
      headers['Authorization'] = `Bearer ${options}`;
    } else {
      if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
      if (options.senderId) headers['x-sender-id'] = options.senderId;
      if (options.senderName) headers['x-sender-name'] = options.senderName;
    }

    const res = await fetch(`${API_BASE}/messages/${id}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete message');
    return data;
  },

  // Media Uploads
  uploadAudio: async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, `voice-note-${Date.now()}.webm`);
    const res = await fetch(`${API_BASE}/upload/audio`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Audio upload failed');
    return data;
  },

  uploadImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const res = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Image upload failed');
    return data;
  },

  // Database Management & Cloud Persistence
  getDbStatus: async (token) => {
    const res = await fetch(`${API_BASE}/admin/database/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch database status');
    return res.json();
  },

  connectDb: async (uri, token) => {
    const res = await fetch(`${API_BASE}/admin/database/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ uri })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to connect database');
    return data;
  },

  exportDbBackup: async (token) => {
    const res = await fetch(`${API_BASE}/admin/database/export`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to export backup');
    return res.json();
  },

  importDbBackup: async (backupData, token) => {
    const res = await fetch(`${API_BASE}/admin/database/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(backupData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to import backup');
    return data;
  },

  // Expenses & Purse Calculations (ఖర్చుల లెక్కలు & మిగులు నిధి)
  getExpenses: async () => {
    const res = await fetch(`${API_BASE}/expenses`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  getExpenseSummary: async () => {
    const res = await fetch(`${API_BASE}/expenses/summary`);
    if (!res.ok) throw new Error('Failed to fetch expense summary');
    return res.json();
  },

  createExpense: async (expenseData, token) => {
    const res = await fetch(`${API_BASE}/admin/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(expenseData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create expense');
    return data;
  },

  updateExpense: async (id, expenseData, token) => {
    const res = await fetch(`${API_BASE}/admin/expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(expenseData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update expense');
    return data;
  },

  deleteExpense: async (id, token) => {
    const res = await fetch(`${API_BASE}/admin/expenses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete expense');
    return data;
  },

  clearAllExpenses: async (token) => {
    const res = await fetch(`${API_BASE}/admin/expenses-all`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to clear all expenses');
    return data;
  },

  // ================= MEMORIES GALLERY API (ఉత్సవ మధుర జ్ఞాపకాలు) =================
  getMemories: async () => {
    const res = await fetch(`${API_BASE}/memories`);
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  },

  uploadMediaFileWithProgress: (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('media', file);

      xhr.open('POST', `${API_BASE}/memories/upload`, true);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percent: percentComplete
            });
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (err) {
            resolve({ success: true, mediaUrl: xhr.responseText });
          }
        } else {
          try {
            const errResponse = JSON.parse(xhr.responseText);
            reject(new Error(errResponse.error || 'Upload failed'));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during media upload. Check your internet connection.'));
      xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again.'));

      xhr.send(formData);
    });
  },

  createMemory: async (memoryData) => {
    const res = await fetch(`${API_BASE}/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memoryData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create memory');
    return data;
  },

  updateMemory: async (id, memoryData, token) => {
    const res = await fetch(`${API_BASE}/admin/memories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(memoryData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update memory');
    return data;
  },

  deleteMemory: async (id, token = null, uploaderId = null) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (uploaderId) headers['x-uploader-id'] = uploaderId;

    const res = await fetch(`${API_BASE}/memories/${id}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete memory');
    return data;
  },

  reactToMemory: async (id, emoji, userId) => {
    const res = await fetch(`${API_BASE}/memories/${id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji, userId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to record reaction');
    return data;
  },

  recordMemoryView: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/memories/${id}/view`, { method: 'POST' });
      return await res.json();
    } catch {
      return null;
    }
  },

  clearAllMemories: async (token) => {
    const res = await fetch(`${API_BASE}/admin/memories-all`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};
