import {
  MiniKit,
  ResponseEvent,
  VerificationLevel,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';

export const VerifyAction = () => {
  const [sentVerifyPayload, setSentVerifyPayload] = useState<Record<
    string,
    any
  > | null>(null);
  const [verificationResponse, setVerificationResponse] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | null>(null);

  const verifyAction = useCallback((params: {
    verification_level: VerificationLevel;
    signal: string;
    action: string;
  }) => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    const result = MiniKit.commands.verify({
      verification_level: params.verification_level,
      signal: params.signal,
      action: params.action
    });
    
    if (!result) {
      console.error('Failed to send verify command');
      return;
    }

    setSentVerifyPayload(params);
    setVerificationStatus('pending');
    setVerificationResponse(null);
  }, []);

  const onProdVerifyClick = useCallback(() => {
    verifyAction({
      verification_level: VerificationLevel.Device,
      signal: 'test',
      action: process.env.NEXT_PUBLIC_PROD_VERIFY_ACTION as string,
    });
  }, [verifyAction]);

  useEffect(() => {
    const handleVerifyResponse = (payload: any) => {
      console.log('Verify response:', payload);
      setVerificationResponse(payload);
      
      if (payload.status === 'success') {
        setVerificationStatus('success');
      } else {
        setVerificationStatus('error');
      }
    };

    MiniKit.subscribe(ResponseEvent.MiniAppVerifyAction, handleVerifyResponse);

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction);
    };
  }, []);

  return (
    <div className="grid gap-y-4">
      <h2 className="font-bold text-2xl" style={{ display: 'none' }}>World ID Verification</h2>

      <button
        className="bg-black text-white rounded-lg p-4 w-full text-lg font-medium"
        onClick={onProdVerifyClick}
        disabled={verificationStatus === 'pending'}
      >
        Verify with World ID
      </button>

      {verificationStatus === 'pending' && (
        <div className="mt-4">
          <p className="text-sm text-gray-500">Verification in progress...</p>
        </div>
      )}

      {verificationStatus === 'success' && (
        <div className="mt-4">
          <p className="text-sm text-green-500">Verification successful!</p>
        </div>
      )}

      {verificationStatus === 'error' && (
        <div className="mt-4">
          <p className="text-sm text-red-500">Verification failed</p>
        </div>
      )}
    </div>
  );
};
