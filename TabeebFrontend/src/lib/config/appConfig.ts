// Configuration for Mock vs Real Backend
// Change USE_MOCK_BACKEND to false when ready to connect to real backend

export const APP_CONFIG = {
  // 🎭 MOCK MODE: Set to false when backend is ready
  USE_MOCK_BACKEND: true,
  
  // Backend URL (when not using mock)
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002',
  
  // Mock settings
  MOCK_SETTINGS: {
    ENABLE_DELAYS: true, // Simulate network delays
    DEFAULT_DELAY: 500, // Default delay in ms
    UPLOAD_DELAY: 1000, // File upload delay
    SAVE_DELAY: 800, // Profile save delay
    VERIFICATION_DELAY: 1500, // Verification submission delay
    
    // Mock behavior
    VERIFICATION_SUCCESS_RATE: 0.9, // 90% success rate for testing
    AUTO_APPROVE_VERIFICATION: false, // Auto-approve after submission (for quick testing)
    
    // Sample data
    SEED_SAMPLE_DATA: false, // Automatically load sample doctor data
  },
  
  // Feature flags
  FEATURES: {
    PROFILE_COMPLETION_TRACKING: true,
    ADVANCED_VERIFICATION: true,
    MOCK_ADMIN_ACTIONS: true, // Enable mock admin approval/rejection
  }
};

// Environment-based configuration
if (typeof window !== 'undefined') {
  // Browser-only configuration
  const urlParams = new URLSearchParams(window.location.search);
  
  // Allow URL override: ?mock=false
  if (urlParams.get('mock') === 'false') {
    APP_CONFIG.USE_MOCK_BACKEND = false;
  }
  
  // Allow URL override: ?mock=true
  if (urlParams.get('mock') === 'true') {
    APP_CONFIG.USE_MOCK_BACKEND = true;
  }
  
  // Development shortcuts: ?seed=true to load sample data
  if (urlParams.get('seed') === 'true') {
    APP_CONFIG.MOCK_SETTINGS.SEED_SAMPLE_DATA = true;
  }
}

export default APP_CONFIG;