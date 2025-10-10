// Application Configuration

export const APP_CONFIG = {
  // Backend URL
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002',
  
  // Feature flags
  FEATURES: {
    PROFILE_COMPLETION_TRACKING: true,
    ADVANCED_VERIFICATION: true,
  }
};

export default APP_CONFIG;