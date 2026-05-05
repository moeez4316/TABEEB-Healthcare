'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, Lock, BarChart3, Calendar, XCircle, Loader } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { completeOnboarding } from '@/lib/doctor-api';

interface OnboardingStep {
  id: number;
  targetId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  placement?: 'right' | 'left' | 'bottom';
  missingHint?: string;
  disableTargetClick?: boolean;
}

interface DoctorOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onRequestOpenEditProfile?: () => void;
}

const STORAGE_KEY = 'doctor-onboarding-step';
const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT = 260;
const TOOLTIP_MARGIN = 16;
const HIGHLIGHT_PADDING = 6;

export const DoctorOnboarding: React.FC<DoctorOnboardingProps> = ({ isOpen, onComplete, onRequestOpenEditProfile }) => {
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (typeof localStorage === 'undefined') return 0;
    const savedStep = localStorage.getItem(STORAGE_KEY);
    if (savedStep === null) return 0;
    const parsed = Number(savedStep);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [missingTargetMessage, setMissingTargetMessage] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const { token } = useAuth();

  const steps = useMemo<OnboardingStep[]>(() => [
    {
      id: 1,
      targetId: 'doctor-profile-edit',
      title: 'Edit profile',
      description: 'Open Edit Profile to set your professional details, fees, and payout methods.',
      icon: <Lock className="w-8 h-8 text-blue-600" />,
      details: [
        'Update qualifications and experience.',
        'Set your consultation fee and follow-up discount.',
        'Add at least one payout method to receive payments.',
      ],
      placement: 'right',
      missingHint: 'Open the dashboard to continue.',
    },
    {
      id: 2,
      targetId: 'doctor-profile-billing-tab',
      title: 'Billing and fees tab',
      description: 'Switch to the Billing and Fees tab to update pricing and payout info.',
      icon: <BarChart3 className="w-8 h-8 text-teal-600" />,
      details: [
        'Set your hourly rate and follow-up discount.',
        'Add payout methods so patients can pay you.',
      ],
      placement: 'right',
      missingHint: 'Open Edit Profile to continue.',
    },
    {
      id: 3,
      targetId: 'doctor-profile-fees',
      title: 'Consultation fees',
      description: 'Enter your hourly consultation rate.',
      icon: <BarChart3 className="w-8 h-8 text-emerald-600" />,
      details: [
        'Set a realistic hourly fee in PKR.',
        'Follow-up discount affects shorter visits.',
      ],
      placement: 'right',
      missingHint: 'Open the Billing and Fees tab to continue.',
    },
    {
      id: 4,
      targetId: 'doctor-profile-payout',
      title: 'Payment methods',
      description: 'Add your payout method so you can receive payments.',
      icon: <CheckCircle className="w-8 h-8 text-indigo-600" />,
      details: [
        'Add bank or wallet details.',
        'Set one method as primary.',
      ],
      placement: 'right',
      missingHint: 'Open the Billing and Fees tab to continue.',
    },
    {
      id: 5,
      targetId: 'doctor-profile-close-btn',
      title: 'Close Edit Profile',
      description: 'You have updated your profile. Close this window to continue.',
      icon: <XCircle className="w-8 h-8 text-red-600" />,
      details: [
        'Make sure you have saved your changes.',
        'Close the modal to return to the dashboard.',
      ],
      placement: 'left',
      missingHint: 'Close the Edit Profile window to continue.',
    },
    {
      id: 6,
      targetId: 'doctor-sidebar-availability',
      title: 'Availability',
      description: 'Set your working hours and breaks so patients can book you.',
      icon: <Calendar className="w-8 h-8 text-orange-600" />,
      details: [
        'Define weekly schedules and break times.',
        'Add specific day overrides when needed.',
      ],
      placement: 'right',
      missingHint: 'Open the sidebar menu to continue.',
      disableTargetClick: true,
    },
    {
      id: 7,
      targetId: 'doctor-sidebar-appointments',
      title: 'Appointments',
      description: 'Review and manage patient appointments.',
      icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
      details: [
        'See upcoming and completed visits.',
        'Review chat, notes, and documents.',
      ],
      placement: 'right',
      missingHint: 'Open the sidebar menu to continue.',
      disableTargetClick: true,
    },
    {
      id: 8,
      targetId: 'doctor-sidebar-dashboard',
      title: 'Dashboard overview',
      description: 'Monitor profile completion and ratings.',
      icon: <BarChart3 className="w-8 h-8 text-teal-600" />,
      details: [
        'Keep your profile updated for better visibility.',
      ],
      placement: 'right',
      missingHint: 'Open the sidebar menu to continue.',
      disableTargetClick: true,
    },
  ], []);

  const getTargetElement = useCallback((targetId: string) => {
    if (typeof document === 'undefined') return null;
    return document.querySelector(
      `[data-onboarding-id="${targetId}"]`
    ) as HTMLElement | null;
  }, []);

  const getTargetRect = useCallback((targetId: string) => {
    const target = getTargetElement(targetId);
    return target ? target.getBoundingClientRect() : null;
  }, [getTargetElement]);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const totalSteps = steps.length;
  const safeCurrentStep = Math.min(Math.max(currentStep, 0), totalSteps - 1);
  const currentStepData = steps[safeCurrentStep];
  const isFirstStep = safeCurrentStep === 0;
  const isLastStep = safeCurrentStep === totalSteps - 1;

  const handleSkip = async () => {
    await markOnboardingComplete();
  };

  const markOnboardingComplete = async () => {
    if (!token) return;

    setIsCompleting(true);
    try {
      await completeOnboarding(token);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      setMissingTargetMessage(null);
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Show error to user would be better, but for now just log
    } finally {
      setIsCompleting(false);
    }
  };

  const goToStep = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= totalSteps) return;

    // Special case: moving from step 0 (Edit Profile) to step 1 (Billing Tab)
    // requires the modal to be open. Ask the parent to open it.
    if (safeCurrentStep === 0 && nextIndex === 1) {
      onRequestOpenEditProfile?.();
      // Don't advance here - advance will happen once the modal opens
      // and the target element appears in the DOM (handled by the MutationObserver)
      return;
    }

    const target = getTargetElement(steps[nextIndex].targetId);
    if (!target) {
      setMissingTargetMessage(
        steps[nextIndex].missingHint || 'Open the related section to continue.'
      );
      return;
    }
    setMissingTargetMessage(null);
    setCurrentStep(nextIndex);
  };

  // We use lazy initialization for currentStep instead of a restore effect
  // to avoid flashing step 0 on mount when returning to the dashboard.

  useEffect(() => {
    if (!isOpen) return;
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, String(safeCurrentStep));
  }, [safeCurrentStep, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let rafId: number | null = null;

    const updateTarget = () => {
      // Auto-advance if we are on Step 1 and the billing tab appears
      if (safeCurrentStep === 0) {
        const billingTab = getTargetElement('doctor-profile-billing-tab');
        if (billingTab) {
          setCurrentStep(1);
          return;
        }
      }

      // Auto-advance if we are on Step 5 (index 4) and the close button disappears
      if (safeCurrentStep === 4) {
        const closeBtn = getTargetElement('doctor-profile-close-btn');
        if (!closeBtn) {
          setCurrentStep(5);
          return;
        }
      }

      const rect = getTargetRect(currentStepData.targetId);
      if (!rect) {
        setTargetRect(null);
        setMissingTargetMessage(
          currentStepData.missingHint || 'Open the related section to continue.'
        );
        return;
      }
      setMissingTargetMessage(null);
      setTargetRect(rect);
    };

    const scheduleUpdate = () => {
      if (typeof window === 'undefined') return;
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateTarget();
      });
    };

    updateTarget();
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true);

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
      observer.disconnect();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepData.targetId, currentStepData.missingHint, isOpen]);

  const resolvePlacement = () => {
    const basePlacement = currentStepData.placement || 'right';
    if (!targetRect || typeof window === 'undefined') return basePlacement;

    const fitsRight = targetRect.right + TOOLTIP_WIDTH + TOOLTIP_MARGIN < window.innerWidth;
    const fitsLeft = targetRect.left - TOOLTIP_WIDTH - TOOLTIP_MARGIN > 0;
    const fitsBottom = targetRect.bottom + TOOLTIP_HEIGHT + TOOLTIP_MARGIN < window.innerHeight;

    if (basePlacement === 'right' && !fitsRight && fitsLeft) return 'left';
    if (basePlacement === 'right' && !fitsRight && !fitsLeft) return 'bottom';
    if (basePlacement === 'left' && !fitsLeft && fitsRight) return 'right';
    if (basePlacement === 'left' && !fitsLeft && !fitsRight) return 'bottom';
    if (basePlacement === 'bottom' && !fitsBottom && fitsRight) return 'right';

    return basePlacement;
  };

  const placement = resolvePlacement();

  const highlightStyle: React.CSSProperties | undefined = targetRect
    ? {
        top: targetRect.top - HIGHLIGHT_PADDING,
        left: targetRect.left - HIGHLIGHT_PADDING,
        width: targetRect.width + HIGHLIGHT_PADDING * 2,
        height: targetRect.height + HIGHLIGHT_PADDING * 2,
        boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.6)',
      }
    : undefined;

  const tooltipStyle: React.CSSProperties | null = (() => {
    if (typeof window === 'undefined') return null;

    if (!targetRect) {
      const left = Math.max(
        TOOLTIP_MARGIN,
        window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_MARGIN
      );
      return { top: TOOLTIP_MARGIN, left };
    }

    let top = targetRect.top + targetRect.height / 2 - TOOLTIP_HEIGHT / 2;
    let left = targetRect.right + TOOLTIP_MARGIN;

    if (placement === 'left') {
      left = targetRect.left - TOOLTIP_WIDTH - TOOLTIP_MARGIN;
    }

    if (placement === 'bottom') {
      top = targetRect.bottom + TOOLTIP_MARGIN;
      left = targetRect.left;
    }

    left = clamp(left, TOOLTIP_MARGIN, window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_MARGIN);
    top = clamp(top, TOOLTIP_MARGIN, window.innerHeight - TOOLTIP_HEIGHT - TOOLTIP_MARGIN);

    return { top, left };
  })();

  if (!isOpen) return null;

  return (
    <>
      {targetRect && highlightStyle && (
        <div
          className={`fixed z-[9998] rounded-lg border-2 border-teal-400/90 shadow-[0_0_20px_rgba(20,184,166,0.45)] ${
            currentStepData.disableTargetClick ? 'pointer-events-auto cursor-default' : 'pointer-events-none'
          }`}
          style={highlightStyle}
          onClick={(e) => {
            if (currentStepData.disableTargetClick) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        />
      )}
      {tooltipStyle && (
        <div
          className="fixed z-[9999] pointer-events-auto"
          style={tooltipStyle}
        >
          <div className="w-[320px] max-w-[90vw] max-h-[70vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-1">{currentStepData.icon}</div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Step {currentStep + 1} of {totalSteps}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {currentStepData.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {currentStepData.description}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                disabled={isCompleting}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                title="Skip onboarding"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {currentStepData.details.map((detail, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-teal-500" />
                  <p className="text-sm text-slate-700 dark:text-slate-200">{detail}</p>
                </div>
              ))}
            </div>

            {missingTargetMessage && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                {missingTargetMessage}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => goToStep(currentStep - 1)}
                disabled={isFirstStep || isCompleting}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isFirstStep || isCompleting
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkip}
                  disabled={isCompleting}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isCompleting
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {isCompleting ? (
                    <span className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Completing...
                    </span>
                  ) : (
                    'Skip'
                  )}
                </button>

                <button
                  onClick={() =>
                    isLastStep ? markOnboardingComplete() : goToStep(currentStep + 1)
                  }
                  disabled={isCompleting}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
                    isCompleting
                      ? 'bg-teal-400 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  {isLastStep ? 'Complete' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
