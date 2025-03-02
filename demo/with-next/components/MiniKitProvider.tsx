'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { ReactNode, useEffect } from 'react';

// Use environment variable for app ID with fallback
const appId = process.env.NEXT_PUBLIC_PROD_VERIFY_APP_ID || 'your-app-id';

export const MiniKitProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    MiniKit.install(appId);
  }, []);

  return <>{children}</>;
};
