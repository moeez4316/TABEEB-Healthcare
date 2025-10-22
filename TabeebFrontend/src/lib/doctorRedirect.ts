// Utility function to get the correct doctor redirect path based on verification status
export function getDoctorRedirectPath(verificationStatus: string | null): string {
  switch (verificationStatus) {
    case 'not-submitted':
        return '/Doctor/verification';
    case 'rejected':
        return '/Doctor/verification/rejected';
    case 'pending':
        return '/Doctor/verification/pending';
    case 'approved':
        return '/Doctor/Dashboard';
    default:
        return '/Doctor/verification'; // Default to verification page
  }
}
