// Offline Storage Service for Todo App v0.7
// Handles local storage and data persistence for offline functionality

class OfflineStorageService {
  constructor() {
    this.storageKey = 'todo_app_offline_data';
    this.queueKey = 'todo_app_action_queue';
    this.cacheKey = 'todo_app_cache';
    this.maxCacheSize = 10 * 1024 * 1024; // 10MB
    this.maxQueueSize = 100; // Maximum queued actions
  }

  // Save data to local storage
  saveData(key, data) {
    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0'
      });
      
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
      return false;
    }
  }

  // Load data from local storage
  loadData(key) {
    try {
      const serializedData = localStorage.getItem(key);
      if (!serializedData) return null;
      
      const parsed = JSON.parse(serializedData);
      return parsed.data;
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      return null;
    }
  }

  // Remove data from local storage
  removeData(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove data from localStorage:', error);
      return false;
    }
  }

  // Save todos for offline access
  saveTodos(todos) {
    return this.saveData(`${this.storageKey}_todos`, todos);
  }

  // Load todos from offline storage
  loadTodos() {
    return this.loadData(`${this.storageKey}_todos`) || [];
  }

  // Save user preferences
  saveUserPreferences(preferences) {
    return this.saveData(`${this.storageKey}_preferences`, preferences);
  }

  // Load user preferences
  loadUserPreferences() {
    return this.loadData(`${this.storageKey}_preferences`) || {};
  }

  // Save notifications
  saveNotifications(notifications) {
    return this.saveData(`${this.storageKey}_notifications`, notifications);
  }

  // Load notifications
  loadNotifications() {
    return this.loadData(`${this.storageKey}_notifications`) || [];
  }

  // Queue action for later sync
  queueAction(action) {
    try {
      const queue = this.getActionQueue();
      
      // Check queue size limit
      if (queue.length >= this.maxQueueSize) {
        // Remove oldest actions
        queue.splice(0, queue.length - this.maxQueueSize + 1);
      }
      
      const queuedAction = {
        id: this.generateActionId(),
        action,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3
      };
      
      queue.push(queuedAction);
      this.saveData(this.queueKey, queue);
      
      return queuedAction.id;
    } catch (error) {
      console.error('Failed to queue action:', error);
      return null;
    }
  }

  // Get action queue
  getActionQueue() {
    return this.loadData(this.queueKey) || [];
  }

  // Remove action from queue
  removeQueuedAction(actionId) {
    try {
      const queue = this.getActionQueue();
      const filteredQueue = queue.filter(action => action.id !== actionId);
      this.saveData(this.queueKey, filteredQueue);
      return true;
    } catch (error) {
      console.error('Failed to remove queued action:', error);
      return false;
    }
  }

  // Clear action queue
  clearActionQueue() {
    return this.removeData(this.queueKey);
  }

  // Get queued actions count
  getQueuedActionsCount() {
    return this.getActionQueue().length;
  }

  // Cache API response
  cacheResponse(url, response, ttl = 300000) { // 5 minutes default TTL
    try {
      const cache = this.getCache();
      const cacheKey = this.generateCacheKey(url);
      
      cache[cacheKey] = {
        data: response,
        timestamp: Date.now(),
        ttl
      };
      
      // Clean expired cache entries
      this.cleanExpiredCache(cache);
      
      // Check cache size
      if (this.getCacheSize(cache) > this.maxCacheSize) {
        this.cleanOldestCache(cache);
      }
      
      this.saveData(this.cacheKey, cache);
      return true;
    } catch (error) {
      console.error('Failed to cache response:', error);
      return false;
    }
  }

  // Get cached response
  getCachedResponse(url) {
    try {
      const cache = this.getCache();
      const cacheKey = this.generateCacheKey(url);
      const cached = cache[cacheKey];
      
      if (!cached) return null;
      
      // Check if expired
      if (Date.now() - cached.timestamp > cached.ttl) {
        delete cache[cacheKey];
        this.saveData(this.cacheKey, cache);
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.error('Failed to get cached response:', error);
      return null;
    }
  }

  // Get cache
  getCache() {
    return this.loadData(this.cacheKey) || {};
  }

  // Generate cache key
  generateCacheKey(url) {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
  }

  // Clean expired cache entries
  cleanExpiredCache(cache) {
    const now = Date.now();
    Object.keys(cache).forEach(key => {
      if (now - cache[key].timestamp > cache[key].ttl) {
        delete cache[key];
      }
    });
  }

  // Clean oldest cache entries
  cleanOldestCache(cache) {
    const entries = Object.entries(cache);
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      delete cache[entries[i][0]];
    }
  }

  // Get cache size
  getCacheSize(cache) {
    return JSON.stringify(cache).length;
  }

  // Clear all cache
  clearCache() {
    return this.removeData(this.cacheKey);
  }

  // Generate unique action ID
  generateActionId() {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save offline indicator state
  saveOfflineState(state) {
    return this.saveData(`${this.storageKey}_offline_state`, state);
  }

  // Load offline indicator state
  loadOfflineState() {
    return this.loadData(`${this.storageKey}_offline_state`) || {
      isOffline: false,
      lastSyncTime: null,
      pendingActions: 0
    };
  }

  // Get storage usage info
  getStorageInfo() {
    try {
      let totalSize = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith('todo_app_')) {
          totalSize += localStorage.getItem(key).length;
        }
      });
      
      return {
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        maxSize: this.maxCacheSize,
        maxSizeFormatted: this.formatBytes(this.maxCacheSize),
        usagePercentage: (totalSize / this.maxCacheSize) * 100
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return null;
    }
  }

  // Format bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Clear all offline data
  clearAllOfflineData() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('todo_app_')) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      return false;
    }
  }

  // Check if storage is available
  isStorageAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get storage quota (if available)
  async getStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          quotaFormatted: this.formatBytes(estimate.quota),
          usageFormatted: this.formatBytes(estimate.usage),
          usagePercentage: (estimate.usage / estimate.quota) * 100
        };
      } catch (error) {
        console.error('Failed to get storage quota:', error);
        return null;
      }
    }
    return null;
  }
}

// Create singleton instance
const offlineStorageService = new OfflineStorageService();

export default offlineStorageService;



