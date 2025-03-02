'use client';

import { VerifyAction } from './VerifyAction';
import { WalletAuth } from './WalletAuth';
import { Leaderboard } from './Leaderboard';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR for the Globe component
const EnhancedGlobe = dynamic(() => import('../../EnhancedGlobe'), { ssr: false });

export const ClientContent = () => {
  return (
    <div className="flex flex-col min-h-[100dvh] p-6 bg-white">
      <h1 className="text-3xl font-bold text-center" style={{ display: 'none' }}>MiniKit Demo</h1>
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Title and description section */}
        <div className="pt-12">
          <h1 className="text-[30px] font-semibold text-center text-[#2D2D2D] max-w-xs mx-auto" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, sans-serif' }}>
            Send Me to Heaven
          </h1>
          <p className="mt-4 text-center text-[16.5px] text-[#5C6F84] tracking-[0.04em] max-w-xs mx-auto leading-relaxed" style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}>
            A network of real humans, competing to throw their phones as high as possible.
          </p>
        </div>
        
        {/* Globe component - centered and larger */}
        <div className="w-full max-w-md mx-auto">
          <EnhancedGlobe />
        </div>
        
        {/* Leaderboard section */}
        <div className="max-w-xs mx-auto w-full">
          <Leaderboard />
        </div>
      </div>
      
      {/* Sticky buttons at the bottom */}
      <div className="sticky bottom-0 w-full max-w-xs mx-auto space-y-4 py-4 bg-white border-t border-gray-100">
        <VerifyAction />
        <hr style={{ display: 'none' }} />
        <WalletAuth />
      </div>
    </div>
  );
};
