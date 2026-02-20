'use client';

import { Suspense } from 'react';
import AIChat from '@/components/AIChat';

export default function PatientAIChatPage() {
  return (
    <Suspense>
      <AIChat />
    </Suspense>
  );
}