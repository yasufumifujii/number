'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { seedDefaultData } from '@/lib/db';

export default function DbProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDefaultData().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-sm">読み込み中...</div>
      </div>
    );
  }

  return <>{children}</>;
}
