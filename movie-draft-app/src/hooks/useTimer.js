import { useState, useEffect, useCallback, useRef } from 'react';
import { DRAFT_CONFIG } from '../data/constants';

export function useTimer(onTimeUp) {
  const [seconds, setSeconds] = useState(DRAFT_CONFIG.TIMER_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const intervalRef = useRef(null);
  
  // Start/resume the timer
  const start = useCallback(() => {
    setIsPaused(false);
  }, []);
  
  // Pause the timer
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);
  
  // Toggle pause state
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);
  
  // Reset timer to full time
  const reset = useCallback(() => {
    setSeconds(DRAFT_CONFIG.TIMER_SECONDS);
    setIsTimeUp(false);
    setIsPaused(false);
  }, []);
  
  // Dismiss time's up alert
  const dismissTimeUp = useCallback(() => {
    setIsTimeUp(false);
  }, []);
  
  // Timer tick effect
  useEffect(() => {
    if (isPaused || isTimeUp) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setIsTimeUp(true);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, isTimeUp, onTimeUp]);
  
  // Format time as mm:ss
  const formattedTime = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  
  return {
    seconds,
    formattedTime,
    isPaused,
    isTimeUp,
    start,
    pause,
    togglePause,
    reset,
    dismissTimeUp,
  };
}
