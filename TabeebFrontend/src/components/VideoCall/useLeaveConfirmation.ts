'use client';

import { useCallback, useEffect, useRef } from 'react';

interface UseLeaveConfirmationOptions {
  isOpen: boolean;
  onConfirmLeave: () => void;
  message?: string;
}

const LEAVE_GUARD_STATE_KEY = '__tabeebVideoCallLeaveGuard';

const withGuardState = (state: unknown) => ({
  ...((state && typeof state === 'object') ? state as Record<string, unknown> : {}),
  [LEAVE_GUARD_STATE_KEY]: true,
});

const withoutGuardState = (state: unknown) => {
  if (!state || typeof state !== 'object') {
    return {};
  }

  const nextState = { ...(state as Record<string, unknown>) };
  delete nextState[LEAVE_GUARD_STATE_KEY];
  return nextState;
};

export function useLeaveConfirmation({
  isOpen,
  onConfirmLeave,
  message = 'Do you want to leave the consultation?',
}: UseLeaveConfirmationOptions) {
  const guardInstalledRef = useRef(false);
  const leavingRef = useRef(false);
  const suppressNextPopRef = useRef(false);

  const removeGuardFromCurrentState = useCallback(() => {
    if (!window.history.state?.[LEAVE_GUARD_STATE_KEY]) return;

    window.history.replaceState(
      withoutGuardState(window.history.state),
      '',
      window.location.href,
    );
  }, []);

  const finalizeLeave = useCallback(() => {
    leavingRef.current = true;
    guardInstalledRef.current = false;
    removeGuardFromCurrentState();

    onConfirmLeave();
  }, [onConfirmLeave, removeGuardFromCurrentState]);

  const requestLeave = useCallback(() => {
    if (window.confirm(message)) {
      finalizeLeave();
    }
  }, [finalizeLeave, message]);

  useEffect(() => {
    if (!isOpen) {
      guardInstalledRef.current = false;
      leavingRef.current = false;
      suppressNextPopRef.current = false;
      return;
    }

    if (!guardInstalledRef.current) {
      window.history.pushState(withGuardState(window.history.state), '', window.location.href);
      guardInstalledRef.current = true;
    }

    const handlePopState = () => {
      if (suppressNextPopRef.current) {
        suppressNextPopRef.current = false;
        return;
      }

      if (leavingRef.current) {
        return;
      }

      if (window.confirm(message)) {
        finalizeLeave();
        return;
      }

      // Stay on the guarded history entry when user cancels leaving.
      suppressNextPopRef.current = true;
      window.history.go(1);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      leavingRef.current = false;
      suppressNextPopRef.current = false;
    };
  }, [isOpen, message, finalizeLeave]);

  return {
    requestLeave,
    finalizeLeave,
  };
}