'use client';

import { Suspense } from 'react';
import AIChat from '@/components/AIChat';

export default function DoctorAIChatPage() {
  return (
    <Suspense>
      <AIChat />
    </Suspense>
  );
}
