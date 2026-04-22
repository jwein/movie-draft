/**
 * Generate a unique session ID
 * Format: 6-character alphanumeric (e.g., "a3f9k2")
 */
export function generateSessionId() {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Get session ID from URL query parameter
 */
export function getSessionIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('session');
}

/**
 * Create shareable session URL
 */
export function createSessionURL(sessionId) {
  const baseURL = window.location.origin + window.location.pathname;
  return `${baseURL}?session=${sessionId}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Generate a unique user ID for role tracking
 * Format: 8-character alphanumeric
 */
export function generateUserId() {
  return Math.random().toString(36).substring(2, 10);
}

