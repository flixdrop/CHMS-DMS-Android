// guards/onboarding.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Preferences } from '@capacitor/preferences';

export const onboardingGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const { value } = await Preferences.get({ key: 'chms_onboarding_completed' });

  if (value === 'true') {
    // Already completed onboarding, send directly to your actual home tab path
    return router.parseUrl('/landing/tabs/home');
  }

  return true;
};