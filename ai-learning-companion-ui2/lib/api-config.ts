/**
 * API Configuration for AI Learning Companion
 */

// Backend API URL
export const API_CONFIG = {
  // Change this to your backend URL in production
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  
  // WebSocket URL
  get WS_URL() {
    return this.BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
  },
  
  // Endpoints
  ENDPOINTS: {
    ANALYZE: '/analyze',
    HEALTH: '/health',
    UPLOAD: '/upload',
    WS_FOCUS: '/ws/focus',
  }
} as const;
