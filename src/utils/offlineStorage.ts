
/**
 * Utility for handling offline data storage and synchronization
 */

const STORAGE_KEYS = {
  DEVICES: 'hydro-devices',
  PINS: 'hydro-pins',
  PROJECTS: 'hydro-projects',
  PENDING_CHANGES: 'hydro-pending-changes',
  LAST_SYNC: 'hydro-last-sync'
};

/**
 * Save data to local storage
 * @param key Storage key
 * @param data Data to store
 */
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to local storage (${key}):`, error);
  }
}

/**
 * Load data from local storage
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
 * Get cached devices from local storage
 * @returns Array of devices or empty array if not found
 */
export function getCachedDevices(): any[] {
  return loadFromLocalStorage(STORAGE_KEYS.DEVICES) || [];
}

/**
 * Get cached pins from local storage
 * @returns Array of pins or empty array if not found
 */
export function getCachedPins(): any[] {
  return loadFromLocalStorage(STORAGE_KEYS.PINS) || [];
}

/**
 * Get cached projects from local storage
 * @returns Array of projects or empty array if not found
 */
export function getCachedProjects(): any[] {
  return loadFromLocalStorage(STORAGE_KEYS.PROJECTS) || [];
}

/**
 * Queue a change to be applied when online
 * @param operation Type of operation (create, update, delete)
 * @param entity Type of entity (project, device, pin)
 * @param data Data for the change
 */
export function queueChange(operation: 'create' | 'update' | 'delete', entity: 'project' | 'device' | 'pin', data: any): void {
  const pendingChanges = loadFromLocalStorage<any[]>(STORAGE_KEYS.PENDING_CHANGES) || [];
  
  pendingChanges.push({
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
    operation,
    entity,
    data,
    status: 'pending'
  });
  
  saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, pendingChanges);
}

/**
 * Get pending changes that need to be synchronized
 * @returns Array of pending changes
 */
export function getPendingChanges(): any[] {
  return loadFromLocalStorage<any[]>(STORAGE_KEYS.PENDING_CHANGES) || [];
}

/**
 * Mark a change as completed
 * @param changeId ID of the change to mark as completed
 */
export function markChangeAsCompleted(changeId: string): void {
  const pendingChanges = loadFromLocalStorage<any[]>(STORAGE_KEYS.PENDING_CHANGES) || [];
  
  const updatedChanges = pendingChanges.map(change => 
    change.id === changeId ? { ...change, status: 'completed' } : change
  );
  
  saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, updatedChanges);
}

/**
 * Remove completed changes
 */
export function removeCompletedChanges(): void {
  const pendingChanges = loadFromLocalStorage<any[]>(STORAGE_KEYS.PENDING_CHANGES) || [];
  
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
 * Clear all cached data
 */
export function clearCache(): void {
  localStorage.removeItem(STORAGE_KEYS.DEVICES);
  localStorage.removeItem(STORAGE_KEYS.PINS);
  localStorage.removeItem(STORAGE_KEYS.PROJECTS);
  localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  // Don't clear pending changes, they still need to be synced
}
