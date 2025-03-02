import {
  MiniKit,
  ResponseEvent,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';

export const WalletAuth = () => {
  const [authStatus, setAuthStatus] = useState<'pending' | 'success' | 'error' | null>(null);

  useEffect(() => {
    const handleWalletAuth = (payload: any) => {
      console.log('Wallet auth response:', payload);
      if (payload.status === 'success') {
        setAuthStatus('success');
      } else {
        setAuthStatus('error');
      }
    };

    MiniKit.subscribe(ResponseEvent.MiniAppWalletAuth, handleWalletAuth);

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppWalletAuth);
    };
  }, []);

  const onSignInWithWallet = useCallback(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }
    
    setAuthStatus('pending');
    const nonce = window.crypto.randomUUID();
    MiniKit.commands.walletAuth({
      nonce: nonce,
      requestId: '0',
      expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      statement: 'Sign in with your wallet to authenticate',
    });
  }, []);

  return (
    <div className="grid gap-y-4">
      <h2 className="text-2xl font-bold" style={{ display: 'none' }}>Wallet Authentication</h2>

      <button
        className="bg-black text-white rounded-lg p-4 w-full text-lg font-medium"
        onClick={onSignInWithWallet}
        disabled={authStatus === 'pending'}
      >
        Sign in with wallet
      </button>

      {authStatus === 'pending' && (
        <div className="mt-4">
          <p className="text-sm text-gray-500">Authentication in progress...</p>
        </div>
      )}

      {authStatus === 'success' && (
        <div className="mt-4">
          <p className="text-sm text-green-500">Successfully authenticated with wallet!</p>
        </div>
      )}

      {authStatus === 'error' && (
        <div className="mt-4">
          <p className="text-sm text-red-500">Authentication failed</p>
        </div>
      )}
    </div>
  );
};
