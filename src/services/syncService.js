/**
 * Sync Service
 *
 * Offline queue that stores failed Supabase writes in localStorage
 * and flushes them when the device comes back online.
 *
 * @module services/syncService
 */

import * as cloud from './supabaseDataService.js';

const SYNC_QUEUE_KEY = 'cognify_sync_queue';

export const syncQueue = {
  /**
   * Add an operation to the offline queue.
   * @param {{ type: string, payload: object, userId: string }} operation
   */
  enqueue(operation) {
    const queue = loadQueue();
    queue.push({ ...operation, enqueuedAt: Date.now() });
    saveQueue(queue);
  },

  /**
   * Process all queued operations. Failed items remain in the queue.
   */
  async flush() {
    const queue = loadQueue();
    if (queue.length === 0) return;

    const failed = [];
    for (const op of queue) {
      try {
        await executeOperation(op);
      } catch (err) {
        // If it's a duplicate key error (session already synced), discard it
        if (err?.code === '23505') continue;
        console.warn('Sync operation failed, will retry:', op.type, err);
        failed.push(op);
      }
    }
    saveQueue(failed);
  },

  /**
   * Get the number of pending sync operations.
   * @returns {number}
   */
  getPendingCount() {
    return loadQueue().length;
  },

  /**
   * Clear the entire queue (used on data reset).
   */
  clear() {
    saveQueue([]);
  },
};

// --- Internal ---

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage full — drop oldest items
    console.warn('Failed to save sync queue');
  }
}

async function executeOperation(op) {
  switch (op.type) {
    case 'INSERT_SESSION':
      await cloud.insertSession(op.userId, op.payload);
      break;
    case 'UPDATE_PROFILE':
      await cloud.updateProfile(op.userId, op.payload);
      break;
    case 'UPDATE_SETTINGS':
      await cloud.updateSettings(op.userId, op.payload);
      break;
    case 'UPDATE_GOALS':
      await cloud.updateGoals(op.userId, op.payload);
      break;
    case 'UPDATE_ONBOARDING':
      await cloud.updateProfile(op.userId, op.payload);
      break;
    case 'INSERT_BADGE':
      await cloud.insertBadge(op.userId, op.payload.badgeId);
      break;
    default:
      console.warn('Unknown sync operation type:', op.type);
  }
}

// Flush queue automatically when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncQueue.flush();
  });
}
