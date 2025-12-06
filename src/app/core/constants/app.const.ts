/**
 * Application-wide constants
 */
export const APP_CONSTANTS = {
  VALIDATION: {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 20,
    USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
    MESSAGE_MAX_LENGTH: 5000
  },
  FILE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  WEBRTC: {
    ICE_SERVERS: [
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  },
  BREAKPOINTS: {
    MOBILE_MAX: 767, // Mobile: < 768px
    DESKTOP_MIN: 768 // Desktop: >= 768px
  }
} as const;

