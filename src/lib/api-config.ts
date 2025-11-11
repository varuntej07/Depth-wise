/**
 * Centralized API Configuration
 *
 * All API endpoints are defined here for easy maintenance and updates.
 * If you need to change the backend URL (e.g., deploy to separate server),
 * just update API_BASE_URL.
 */

// Base URL for API calls
// Empty string means same domain (Next.js API routes)
// For separate backend, use: process.env.NEXT_PUBLIC_API_URL || ''
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Session Management
  SESSION_CREATE: `${API_BASE_URL}/api/session/create`,
  SESSION_LIST: `${API_BASE_URL}/api/sessions`,
  SESSION_GET: (id: string) => `${API_BASE_URL}/api/session/${id}`,
  SESSION_SHARE: (id: string) => `${API_BASE_URL}/api/session/${id}/share`,

  // Exploration
  EXPLORE_NODE: `${API_BASE_URL}/api/explore`,

  // User & Usage
  USER_USAGE: `${API_BASE_URL}/api/user/usage`,

  // Sharing
  SHARE_GET: (sessionId: string) => `${API_BASE_URL}/api/share/${sessionId}`,

  // Authentication (NextAuth)
  AUTH: `${API_BASE_URL}/api/auth`,
} as const;

/**
 * Helper function to build API URL with base
 * Use this if you need dynamic endpoint construction
 */
export function buildApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
