'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/services/auth.service';

export function useSetupStatus() {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    authService
      .getSetupStatus(controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setNeedsSetup(Boolean(res.needsSetup));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, []);

  return { needsSetup, checking };
}
