// Offline Data Storage & Background Sync Manager for Vijaya Colony Ganesha Diaries

const STORAGE_KEYS = {
  SETTINGS: 'ganesh_offline_settings',
  DONORS: 'ganesh_offline_donors',
  STATS: 'ganesh_offline_stats',
  EVENTS: 'ganesh_offline_events',
  MESSAGES: 'ganesh_offline_messages',
  AUCTION: 'ganesh_offline_auction',
  EXPENSES: 'ganesh_offline_expenses',
  QUEUE: 'ganesh_offline_sync_queue'
};

// Save devotional state to offline local storage
export const saveOfflineData = (key, data) => {
  try {
    if (data !== undefined && data !== null) {
      localStorage.setItem(STORAGE_KEYS[key] || `ganesh_offline_${key}`, JSON.stringify(data));
    }
  } catch (err) {
    console.warn(`Failed to save offline data for ${key}:`, err);
  }
};

// Retrieve devotional state from offline local storage
export const getOfflineData = (key, defaultValue = null) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key] || `ganesh_offline_${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.warn(`Failed to read offline data for ${key}:`, err);
    return defaultValue;
  }
};

// Queue an action performed while offline (e.g. donation, expense, message, bid)
export const enqueueOfflineAction = (actionType, payload) => {
  try {
    const queue = getOfflineQueue();
    const actionItem = {
      id: 'offline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      type: actionType,
      payload,
      createdAt: new Date().toISOString()
    };
    queue.push(actionItem);
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
    
    // Dispatch event so UI can display pending sync badge
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: queue.length } }));
    return actionItem;
  } catch (err) {
    console.error('Failed to enqueue offline action:', err);
    return null;
  }
};

// Get list of pending offline actions
export const getOfflineQueue = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

// Remove a synced action from queue
export const removeOfflineAction = (actionId) => {
  try {
    const queue = getOfflineQueue().filter(item => item.id !== actionId);
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: queue.length } }));
  } catch (err) {
    console.error('Failed to remove offline action:', err);
  }
};

// Sync all pending offline actions to the cloud backend
export const syncOfflineActions = async (api, adminToken = null) => {
  const queue = getOfflineQueue();
  if (!queue || queue.length === 0) return { success: true, syncedCount: 0 };

  let syncedCount = 0;
  for (const item of queue) {
    try {
      switch (item.type) {
        case 'CREATE_DONOR':
          await api.createDonor(item.payload);
          break;
        case 'CREATE_MESSAGE':
          await api.sendMessage(item.payload);
          break;
        case 'PLACE_BID':
          await api.placeAuctionBid(item.payload.bidData, adminToken);
          break;
        case 'CREATE_EXPENSE':
          await api.createExpense(item.payload, adminToken);
          break;
        case 'UPDATE_EXPENSE':
          await api.updateExpense(item.payload.id, item.payload.data, adminToken);
          break;
        case 'DELETE_EXPENSE':
          await api.deleteExpense(item.payload.id, adminToken);
          break;
        default:
          console.warn('Unknown offline action type:', item.type);
      }
      // Remove successfully synced item
      removeOfflineAction(item.id);
      syncedCount++;
    } catch (err) {
      console.error(`Failed to sync offline action ${item.type}:`, err);
      // Leave in queue for next sync retry
    }
  }

  if (syncedCount > 0) {
    window.dispatchEvent(new CustomEvent('offline-sync-completed', { detail: { syncedCount } }));
  }

  return { success: true, syncedCount, remainingCount: getOfflineQueue().length };
};
