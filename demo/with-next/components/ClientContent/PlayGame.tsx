'use client';

import { useState, useEffect, useRef } from 'react';

// Physics constants - adjusted for better sensitivity
const GRAVITY = 9.81; // m/s²
const THROW_THRESHOLD = 14; // Lowered back to be more sensitive
const FREEFALL_THRESHOLD = 4; // Increased to better detect free-fall
const IMPACT_THRESHOLD = 8; // Lowered to detect impacts more easily
const MAX_REALISTIC_HEIGHT = 20; // Maximum realistic height in meters
const MIN_FREEFALL_TIME = 0.1; // Minimum free-fall time to consider valid (in seconds)
const STARTUP_DELAY = 2000; // Delay before starting to detect throws (ms)

export const PlayGame = () => {
  const [showModal, setShowModal] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'ready' | 'starting' | 'playing' | 'finished'>('ready');
  const [height, setHeight] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentAccel, setCurrentAccel] = useState<string>('');
  const [countdown, setCountdown] = useState(0);
  const [accelValue, setAccelValue] = useState(0); // Current acceleration value for visual indicator

  // Refs for tracking motion data
  const isThrowingRef = useRef(false);
  const isInFreeFallRef = useRef(false);
  const freeFallStartTimeRef = useRef(0);
  const throwStartTimeRef = useRef(0);
  const gameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startupTimeRef = useRef(0);
  const readyToDetectRef = useRef(false);
  const accelHistoryRef = useRef<number[]>([]);
  const lastAccelUpdateRef = useRef(0);

  // Simple function to add debug messages
  const addDebug = (message: string) => {
    setDebugInfo(prev => {
      const newDebug = [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]}: ${message}`];
      // Keep only the last 50 messages to prevent memory issues
      if (newDebug.length > 50) {
        return newDebug.slice(newDebug.length - 50);
      }
      return newDebug;
    });
  };

  // Function to request device motion permission
  const requestMotionPermission = () => {
    addDebug('Button clicked - requesting permission');
    
    try {
      if (typeof window !== 'undefined') {
        if (typeof window.DeviceMotionEvent === 'undefined') {
          addDebug('DeviceMotionEvent is not supported');
          setPermissionStatus('not-supported');
          return;
        }
        
        // Check if we need to request permission (iOS 13+)
        if (typeof (window.DeviceMotionEvent as any).requestPermission === 'function') {
          addDebug('iOS detected, calling requestPermission()');
          
          // This must be called directly from a user interaction
          (window.DeviceMotionEvent as any).requestPermission()
            .then((result: string) => {
              addDebug(`Permission result: ${result}`);
              setPermissionStatus(result);
              
              if (result === 'granted') {
                setStatusMessage('Permission granted! Get ready...');
                // Start the game with a delay
                startGameWithDelay();
              }
            })
            .catch((error: any) => {
              const errorMsg = error instanceof Error ? error.message : String(error);
              addDebug(`Permission error: ${errorMsg}`);
              setPermissionStatus('error');
              setStatusMessage('Error getting permission. Please try again.');
            });
        } else {
          // Android or older iOS
          addDebug('No permission needed (Android or older iOS)');
          setPermissionStatus('granted-by-default');
          setStatusMessage('Permission granted! Get ready...');
          startGameWithDelay();
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addDebug(`Exception: ${errorMsg}`);
      setPermissionStatus('error');
      setStatusMessage('An error occurred. Please try again.');
    }
  };

  // Start the game with a countdown delay
  const startGameWithDelay = () => {
    addDebug('Starting game with delay');
    setGameState('starting');
    setCountdown(Math.floor(STARTUP_DELAY / 1000));
    
    // Reset acceleration history
    accelHistoryRef.current = [];
    
    // Start a countdown
    let remainingTime = STARTUP_DELAY;
    const countdownInterval = setInterval(() => {
      remainingTime -= 1000;
      setCountdown(Math.max(0, Math.floor(remainingTime / 1000)));
      
      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
        startGame();
      }
    }, 1000);
  };

  // Start the game
  const startGame = () => {
    addDebug('Starting actual game measurements');
    setGameState('playing');
    
    // Reset tracking variables
    isThrowingRef.current = false;
    isInFreeFallRef.current = false;
    freeFallStartTimeRef.current = 0;
    throwStartTimeRef.current = 0;
    readyToDetectRef.current = false;
    startupTimeRef.current = Date.now();
    accelHistoryRef.current = [];
    
    // Start listening to motion events
    window.addEventListener('devicemotion', handleMotion);
    
    setStatusMessage('Ready! Throw your phone upward...');
    
    // Set a timeout to stop the game if no throw is detected
    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
    }
    
    gameTimeoutRef.current = setTimeout(() => {
      if (gameState === 'playing') {
        addDebug('Game timeout reached - no complete throw detected');
        stopGame();
        setStatusMessage('No complete throw detected. Try again!');
        setHeight(0);
      }
    }, 20000); // 20 seconds timeout
    
    // Set a timeout before we start detecting throws to avoid false positives
    setTimeout(() => {
      addDebug('Now ready to detect throws');
      readyToDetectRef.current = true;
    }, 1000);
  };

  // Stop the game
  const stopGame = () => {
    addDebug('Stopping game');
    window.removeEventListener('devicemotion', handleMotion);
    setGameState('finished');
    
    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
      gameTimeoutRef.current = null;
    }
  };

  // Handle motion events
  const handleMotion = (event: DeviceMotionEvent) => {
    // Skip processing if we're in the initial stabilization period
    if (!readyToDetectRef.current) return;
    
    if (!event.accelerationIncludingGravity) {
      addDebug('No accelerationIncludingGravity data available');
      return;
    }
    
    const { x, y, z } = event.accelerationIncludingGravity;
    if (x === null || y === null || z === null) return;
    
    const timestamp = Date.now();
    
    // Calculate total acceleration magnitude (removing gravity component)
    const totalAccel = Math.sqrt(
      Math.pow(x, 2) + 
      Math.pow(y, 2) + 
      Math.pow(z - GRAVITY, 2)
    );
    
    // Store acceleration in history (for adaptive thresholds)
    accelHistoryRef.current.push(totalAccel);
    if (accelHistoryRef.current.length > 20) {
      accelHistoryRef.current.shift(); // Keep only last 20 values
    }
    
    // Update visual acceleration indicator (limit updates to avoid UI lag)
    if (timestamp - lastAccelUpdateRef.current > 100) { // Update every 100ms
      setAccelValue(totalAccel);
      lastAccelUpdateRef.current = timestamp;
      
      // Update text display of acceleration
      setCurrentAccel(`x=${x.toFixed(1)}, y=${y.toFixed(1)}, z=${z.toFixed(1)}, total=${totalAccel.toFixed(1)}`);
    }
    
    // Detect throw initiation (high upward acceleration)
    // Use a dynamic threshold based on recent acceleration history
    const avgAccel = accelHistoryRef.current.reduce((sum, val) => sum + val, 0) / 
                    Math.max(1, accelHistoryRef.current.length);
    const dynamicThreshold = Math.max(THROW_THRESHOLD, avgAccel * 2);
    
    if (!isThrowingRef.current && totalAccel > dynamicThreshold) {
      // Make sure we've been running for at least the startup delay
      const timeSinceStart = timestamp - startupTimeRef.current;
      if (timeSinceStart < STARTUP_DELAY) {
        addDebug(`Ignoring early acceleration spike: ${totalAccel.toFixed(2)} (too soon after start)`);
        return;
      }
      
      isThrowingRef.current = true;
      throwStartTimeRef.current = timestamp;
      addDebug(`Throw detected with acceleration: ${totalAccel.toFixed(2)} (threshold: ${dynamicThreshold.toFixed(2)})`);
      setStatusMessage('Throw detected!');
    }
    
    // Detect free-fall state (near-zero gravity)
    if (isThrowingRef.current && !isInFreeFallRef.current && totalAccel < FREEFALL_THRESHOLD) {
      isInFreeFallRef.current = true;
      freeFallStartTimeRef.current = timestamp;
      addDebug(`Free-fall started at: ${new Date(timestamp).toISOString()} with accel: ${totalAccel.toFixed(2)}`);
      setStatusMessage('Free-falling...');
    }
    
    // Detect impact/catch (high acceleration after free-fall)
    if (isInFreeFallRef.current && totalAccel > IMPACT_THRESHOLD) {
      const freeFallEndTime = timestamp;
      const freeFallDuration = (freeFallEndTime - freeFallStartTimeRef.current) / 1000; // in seconds
      
      addDebug(`Impact detected with accel: ${totalAccel.toFixed(2)}. Free-fall duration: ${freeFallDuration.toFixed(3)}s`);
      
      // Check if free-fall duration is reasonable
      if (freeFallDuration < MIN_FREEFALL_TIME) {
        addDebug(`Free-fall too short (${freeFallDuration.toFixed(3)}s < ${MIN_FREEFALL_TIME}s)`);
        setStatusMessage('Throw too short. Try again with a higher throw!');
        setHeight(0);
      } else {
        // Calculate height using physics formula: h = g*t²/8
        let calculatedHeight = (GRAVITY * Math.pow(freeFallDuration, 2)) / 8;
        
        // Cap at maximum realistic height
        if (calculatedHeight > MAX_REALISTIC_HEIGHT) {
          addDebug(`Unrealistic height capped: ${calculatedHeight.toFixed(2)}m -> ${MAX_REALISTIC_HEIGHT}m`);
          calculatedHeight = MAX_REALISTIC_HEIGHT;
        }
        
        addDebug(`Final height calculation: ${calculatedHeight.toFixed(2)}m`);
        setHeight(calculatedHeight);
        setStatusMessage(`Great throw! Height: ${calculatedHeight.toFixed(2)}m`);
      }
      
      // End the game
      stopGame();
    }
  };

  // Clean up event listeners
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      if (gameTimeoutRef.current) {
        clearTimeout(gameTimeoutRef.current);
      }
    };
  }, []);

  const openModal = () => {
    setShowModal(true);
    setDebugInfo([]);
    setGameState('ready');
    setHeight(0);
    setStatusMessage('');
    setCurrentAccel('');
    setCountdown(0);
    setAccelValue(0);
    addDebug('Modal opened');
  };

  const closeModal = () => {
    setShowModal(false);
    window.removeEventListener('devicemotion', handleMotion);
    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
    }
  };

  const tryAgain = () => {
    setGameState('ready');
    setHeight(0);
    setStatusMessage('');
    setCurrentAccel('');
    setCountdown(0);
    setAccelValue(0);
    addDebug('Resetting game');
  };

  // Force a manual stop function for when the game gets stuck
  const forceStop = () => {
    addDebug('Game manually stopped by user');
    stopGame();
    setStatusMessage('Game manually stopped');
  };

  return (
    <div>
      <button
        className="bg-green-500 text-white rounded-xl p-4 w-full text-lg font-medium shadow-md hover:bg-green-600 transition-colors"
        onClick={openModal}
      >
        PLAY GAME
      </button>

      {/* Game modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md text-white">
            <h2 className="text-2xl font-bold mb-6 text-center">Send Me To Heaven</h2>
            
            {/* Countdown display */}
            {gameState === 'starting' && countdown > 0 && (
              <div className="mb-6 text-center">
                <p className="text-lg mb-2">Get ready to throw in</p>
                <p className="text-5xl font-bold text-yellow-400">{countdown}</p>
              </div>
            )}
            
            {/* Height display */}
            {gameState === 'finished' && height > 0 && (
              <div className="mb-6 text-center">
                <p className="text-lg mb-2">Your throw reached</p>
                <p className="text-5xl font-bold text-green-400">{height.toFixed(2)}m</p>
              </div>
            )}
            
            {/* Status message */}
            {statusMessage && (
              <p className="text-center mb-4">{statusMessage}</p>
            )}
            
            {/* Acceleration visual indicator */}
            {(gameState === 'playing' || gameState === 'starting') && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>0</span>
                  <span>Acceleration</span>
                  <span>20+</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-100"
                    style={{ width: `${Math.min(100, (accelValue / 20) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-center mt-1 text-xs text-gray-400">{currentAccel}</p>
              </div>
            )}
            
            {/* Game controls */}
            <div className="mb-6 space-y-4">
              {gameState === 'ready' && (
                <button
                  onClick={requestMotionPermission}
                  className="bg-green-500 text-white rounded-xl py-3 px-8 w-full text-lg font-medium hover:bg-green-600 transition-colors"
                >
                  Start Game
                </button>
              )}
              
              {gameState === 'starting' && (
                <div className="text-center py-4">
                  <div className="animate-pulse text-xl">Preparing sensors...</div>
                  <div className="mt-2 text-sm text-gray-400">Hold your phone steady</div>
                </div>
              )}
              
              {gameState === 'playing' && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="animate-pulse text-xl">Game in progress...</div>
                    <div className="mt-2 text-sm text-gray-400">Throw your phone upward!</div>
                  </div>
                  
                  <button
                    onClick={forceStop}
                    className="bg-red-500 text-white rounded-xl py-2 px-4 w-full text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    Stop Measuring (If Stuck)
                  </button>
                </div>
              )}
              
              {gameState === 'finished' && (
                <button
                  onClick={tryAgain}
                  className="bg-green-500 text-white rounded-xl py-3 px-8 w-full text-lg font-medium hover:bg-green-600 transition-colors"
                >
                  Try Again
                </button>
              )}
              
              <button
                onClick={closeModal}
                className="bg-transparent border border-white text-white rounded-xl py-3 px-8 w-full text-lg font-medium hover:bg-white hover:text-black transition-colors"
              >
                Close
              </button>
            </div>
            
            {/* Debug log */}
            <div className="mt-6 border border-gray-700 rounded-lg p-2 bg-black">
              <p className="text-xs text-gray-400 mb-2">Debug Log:</p>
              <div className="h-40 overflow-y-auto text-xs text-gray-400">
                {debugInfo.map((message, index) => (
                  <div key={index} className="mb-1">{message}</div>
                ))}
                {debugInfo.length === 0 && <div className="text-gray-600">No logs yet</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 