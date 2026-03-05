import { useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

const HEARTBEAT_INTERVAL_MS = 30_000;

export function useSessionHeartbeat(sessionId: string | null, isAnonymous: boolean = false) {
  useEffect(() => {
    if (!sessionId) return;

    let intervalId: ReturnType<typeof setInterval>;
    let accumulatedSec = 0;

    const sendHeartbeat = () => {
      if (accumulatedSec <= 0) return;
      const durationSec = accumulatedSec;
      accumulatedSec = 0;

      fetch(API_ENDPOINTS.SESSION_HEARTBEAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, durationSec, isAnonymous }),
      }).catch(() => {});
    };

    const tick = () => {
      if (document.visibilityState === 'visible') {
        accumulatedSec += HEARTBEAT_INTERVAL_MS / 1000;
      }
      sendHeartbeat();
    };

    intervalId = setInterval(tick, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sendHeartbeat(); // Flush on unmount
    };
  }, [sessionId, isAnonymous]);
}
