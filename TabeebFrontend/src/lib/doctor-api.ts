import { APP_CONFIG } from '@/lib/config/appConfig';

const API_URL = APP_CONFIG.API_URL;

/**
 * Doctor API functions for onboarding and profile management
 */

export interface OnboardingStatus {
  hasCompletedOnboarding: boolean;
}

export interface OnboardingCompleteResponse {
  message: string;
  hasCompletedOnboarding: boolean;
}

/**
 * Get the doctor's onboarding status
 */
export async function getOnboardingStatus(token: string): Promise<OnboardingStatus> {
  if (!token) {
    throw new Error('Token is required');
  }

  const response = await fetch(`${API_URL}/api/doctor/onboarding-status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get onboarding status');
  }

  return response.json();
}

/**
 * Mark onboarding as completed for the doctor
 */
export async function completeOnboarding(token: string): Promise<OnboardingCompleteResponse> {
  if (!token) {
    throw new Error('Token is required');
  }

  const response = await fetch(`${API_URL}/api/doctor/complete-onboarding`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to complete onboarding');
  }

  return response.json();
}
