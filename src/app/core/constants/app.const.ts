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
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  }
} as const;

