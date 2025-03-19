/**
 * Utility for handling offline data storage and synchronization
 */

export interface OfflineDevice {
  id: string;
  name: string;
  description: string;
  projectId: string;
  createdAt: string;
  lastSeen: string;
  isConnected: boolean;
  type?: string;
}

export interface OfflinePin {
  id: string;
  name: string;
  pinNumber: number;
  mode: 'input' | 'output';
  signalType: string;
  dataType: string;
  unit?: string;
  deviceId: string;
  createdAt: string;
  value?: string;
  label?: string;
  lastUpdated?: string;
}

export interface OfflineProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface PendingChange {
  id: string;
  timestamp: number;
  operation: 'create' | 'update' | 'delete';
  entity: 'project' | 'device' | 'pin';
  data: any;
  status: 'pending' | 'completed' | 'error';
  errorMessage?: string;
}

const STORAGE_KEYS = {
  DEVICES: 'hydro-devices',
  PINS: 'hydro-pins',
  PROJECTS: 'hydro-projects',
  PENDING_CHANGES: 'hydro-pending-changes',
  LAST_SYNC: 'hydro-last-sync',
  RECENT_PIN_DATA: 'hydro-recent-pin-data'
};

/**
 * Save data to local storage with error handling
 * @param key Storage key
 * @param data Data to store
 */
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to local storage (${key}):`, error);
    
    // If error is due to quota exceeded, try to clear old data
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try {
        // Clear the oldest pending changes if they exist
        const pendingChanges = loadFromLocalStorage<PendingChange[]>(STORAGE_KEYS.PENDING_CHANGES) || [];
        if (pendingChanges.length > 10) {
          // Keep only the 10 most recent changes
          const sortedChanges = pendingChanges.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
          saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, sortedChanges);
        }
        
        // Try saving again
        localStorage.setItem(key, JSON.stringify(data));
      } catch (innerError) {
        console.error(`Failed to recover from storage quota error:`, innerError);
      }
    }
  }
}

/**
 * Load data from local storage with error handling
 * @param key Storage key
 * @returns Stored data or null if not found
 */
export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error loading from local storage (${key}):`, error);
    return null;
  }
}

/**
 * Store devices data for offline use
 * @param devices Array of devices
 */
export function storeDevices(devices: any[]): void {
  saveToLocalStorage(STORAGE_KEYS.DEVICES, devices);
  saveToLocalStorage(STORAGE_KEYS.LAST_SYNC, Date.now());
}

/**
 * Store pins data for offline use
 * @param pins Array of pins
 */
export function storePins(pins: any[]): void {
  saveToLocalStorage(STORAGE_KEYS.PINS, pins);
  saveToLocalStorage(STORAGE_KEYS.LAST_SYNC, Date.now());
}

/**
 * Store projects data for offline use
 * @param projects Array of projects
 */
export function storeProjects(projects: any[]): void {
  saveToLocalStorage(STORAGE_KEYS.PROJECTS, projects);
  saveToLocalStorage(STORAGE_KEYS.LAST_SYNC, Date.now());
}

/**
 * Store recent pin data changes
 * @param pinId Pin ID
 * @param value New value
 */
export function storeRecentPinData(pinId: string, value: string): void {
  const recentData = loadFromLocalStorage<Record<string, { value: string, timestamp: number }>>(STORAGE_KEYS.RECENT_PIN_DATA) || {};
  
  recentData[pinId] = {
    value,
    timestamp: Date.now()
  };
  
  // Only keep the last 50 pins' data to avoid storage issues
  const pinIds = Object.keys(recentData);
  if (pinIds.length > 50) {
    // Sort by timestamp and remove oldest
    const sortedPins = pinIds
      .map(id => ({ id, timestamp: recentData[id].timestamp }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest pins
    for (let i = 0; i < sortedPins.length - 50; i++) {
      delete recentData[sortedPins[i].id];
    }
  }
  
  saveToLocalStorage(STORAGE_KEYS.RECENT_PIN_DATA, recentData);
}

/**
 * Get recent pin data
 * @param pinId Pin ID
 * @returns Most recent value or null
 */
export function getRecentPinData(pinId: string): string | null {
  const recentData = loadFromLocalStorage<Record<string, { value: string, timestamp: number }>>(STORAGE_KEYS.RECENT_PIN_DATA) || {};
  return recentData[pinId]?.value || null;
}

/**
 * Get cached devices from local storage
 * @returns Array of devices or empty array if not found
 */
export function getCachedDevices<T = any[]>(): T {
  return loadFromLocalStorage<T>(STORAGE_KEYS.DEVICES) || [] as unknown as T;
}

/**
 * Get cached pins from local storage
 * @returns Array of pins or empty array if not found
 */
export function getCachedPins<T = any[]>(): T {
  return loadFromLocalStorage<T>(STORAGE_KEYS.PINS) || [] as unknown as T;
}

/**
 * Get cached projects from local storage
 * @returns Array of projects or empty array if not found
 */
export function getCachedProjects<T = any[]>(): T {
  return loadFromLocalStorage<T>(STORAGE_KEYS.PROJECTS) || [] as unknown as T;
}

/**
 * Get cached device by ID
 * @param deviceId Device ID
 * @returns Device object or null if not found
 */
export function getCachedDeviceById(deviceId: string): OfflineDevice | null {
  const devices = getCachedDevices<OfflineDevice[]>();
  return devices.find(d => d.id === deviceId) || null;
}

/**
 * Get cached pins by device ID
 * @param deviceId Device ID
 * @returns Array of pins for the device
 */
export function getCachedPinsByDeviceId(deviceId: string): OfflinePin[] {
  const pins = getCachedPins<OfflinePin[]>();
  return pins.filter(p => p.deviceId === deviceId);
}

/**
 * Get cached project by ID
 * @param projectId Project ID
 * @returns Project object or null if not found
 */
export function getCachedProjectById(projectId: string): OfflineProject | null {
  const projects = getCachedProjects<OfflineProject[]>();
  return projects.find(p => p.id === projectId) || null;
}

/**
 * Queue a change to be applied when online
 * @param operation Type of operation (create, update, delete)
 * @param entity Type of entity (project, device, pin)
 * @param data Data for the change
 */
export function queueChange(operation: 'create' | 'update' | 'delete', entity: 'project' | 'device' | 'pin', data: any): void {
  const pendingChanges = loadFromLocalStorage<PendingChange[]>(STORAGE_KEYS.PENDING_CHANGES) || [];
  
  const newChange: PendingChange = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
    operation,
    entity,
    data,
    status: 'pending'
  };
  
  pendingChanges.push(newChange);
  
  // Limit the number of pending changes to avoid storage issues
  if (pendingChanges.length > 100) {
    // Remove oldest completed changes first
    const completed = pendingChanges.filter(c => c.status === 'completed');
    if (completed.length > 0) {
      const remainingPending = pendingChanges.filter(c => c.status !== 'completed');
      const sortedCompleted = completed.sort((a, b) => a.timestamp - b.timestamp);
      
      // Keep newest completed changes up to 50
      const keptCompleted = sortedCompleted.slice(Math.max(0, sortedCompleted.length - 50));
      
      // Combine pending and kept completed changes
      saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, [...remainingPending, ...keptCompleted]);
    } else {
      // If no completed changes, remove oldest pending changes
      const sorted = pendingChanges.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);
      saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, sorted);
    }
  } else {
    saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, pendingChanges);
  }
  
  console.log(`Change queued for later synchronization: ${operation} ${entity}`);
}

/**
 * Get pending changes that need to be synchronized
 * @param status Optional status filter
 * @returns Array of pending changes
 */
export function getPendingChanges(status?: 'pending' | 'completed' | 'error'): PendingChange[] {
  const allChanges = loadFromLocalStorage<PendingChange[]>(STORAGE_KEYS.PENDING_CHANGES) || [];
  
  if (status) {
    return allChanges.filter(change => change.status === status);
  }
  
  return allChanges;
}

/**
 * Update the status of a pending change
 * @param changeId ID of the change to update
 * @param status New status
 * @param errorMessage Optional error message
 */
export function updateChangeStatus(
  changeId: string, 
  status: 'pending' | 'completed' | 'error',
  errorMessage?: string
): void {
  const pendingChanges = loadFromLocalStorage<PendingChange[]>(STORAGE_KEYS.PENDING_CHANGES) || [];
  
  const updatedChanges = pendingChanges.map(change => 
    change.id === changeId
      ? { ...change, status, ...(errorMessage ? { errorMessage } : {}) }
      : change
  );
  
  saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, updatedChanges);
}

/**
 * Mark a change as completed
 * @param changeId ID of the change to mark as completed
 */
export function markChangeAsCompleted(changeId: string): void {
  updateChangeStatus(changeId, 'completed');
}

/**
 * Mark a change as failed with error message
 * @param changeId ID of the change to mark as error
 * @param errorMessage Error message
 */
export function markChangeAsError(changeId: string, errorMessage: string): void {
  updateChangeStatus(changeId, 'error', errorMessage);
}

/**
 * Remove completed changes
 */
export function removeCompletedChanges(): void {
  const pendingChanges = loadFromLocalStorage<PendingChange[]>(STORAGE_KEYS.PENDING_CHANGES) || [];
  
  const filteredChanges = pendingChanges.filter(change => change.status !== 'completed');
  
  saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, filteredChanges);
}

/**
 * Check if the cached data is still fresh (not older than maxAge)
 * @param maxAge Maximum age in milliseconds
 * @returns Boolean indicating if the cache is fresh
 */
export function isCacheFresh(maxAge: number = 3600000): boolean { // Default: 1 hour
  const lastSync = loadFromLocalStorage<number>(STORAGE_KEYS.LAST_SYNC);
  if (!lastSync) return false;
  
  return Date.now() - lastSync < maxAge;
}

/**
 * Clear all cached data except pending changes
 */
export function clearCache(): void {
  localStorage.removeItem(STORAGE_KEYS.DEVICES);
  localStorage.removeItem(STORAGE_KEYS.PINS);
  localStorage.removeItem(STORAGE_KEYS.PROJECTS);
  localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  localStorage.removeItem(STORAGE_KEYS.RECENT_PIN_DATA);
  // Don't clear pending changes, they still need to be synced
}

/**
 * Reset all cached data including pending changes
 * Only use this for complete reset, e.g. when logging out
 */
export function resetAllStorage(): void {
  clearCache();
  localStorage.removeItem(STORAGE_KEYS.PENDING_CHANGES);
}
