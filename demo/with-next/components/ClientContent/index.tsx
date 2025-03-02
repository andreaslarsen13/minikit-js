'use client';

import { VerifyAction } from './VerifyAction';
import { WalletAuth } from './WalletAuth';

export const ClientContent = () => {
  return (
    <div className="p-2 lg:p-8 grid content-start min-h-[100dvh] gap-y-8">
      <h1 className="text-3xl font-bold text-center" style={{ display: 'none' }}>MiniKit Demo</h1>
      
      <div className="grid gap-y-8 max-w-2xl mx-auto w-full">
        <VerifyAction />
        <hr style={{ display: 'none' }} />
        <WalletAuth />
      </div>
    </div>
  );
};
