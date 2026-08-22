const API_BASE = '/api';

export const api = {
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
  }
};
