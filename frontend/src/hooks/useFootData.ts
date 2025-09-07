import { useEffect, useState, useRef } from 'react';
import database from '../firebase';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import type { FootData, WSData } from '../types';

export function useFootData(wsUrl: string = 'ws://localhost:8000/ws/imu') {
  const [leftFootProcessed, setLeftFootProcessed] = useState<FootData[]>([]);
  const [rightFootProcessed, setRightFootProcessed] = useState<FootData[]>([]);
  const [asymmetryIndex, setAsymmetryIndex] = useState<number | Record<string, number> | null>(null);
  const MAX_POINTS = 200;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ----------------- Firebase subscription -----------------
  useEffect(() => {
    const leftRef = query(ref(database, 'leftFoot'), limitToLast(1));
    const rightRef = query(ref(database, 'rightFoot'), limitToLast(1));

    const unsubscribeLeft = onValue(leftRef, (snapshot) => {
      const data = snapshot.val() as Record<string, FootData> | null;
      if (data) {
        setLeftFootProcessed((prev) => [
          ...prev.slice(-MAX_POINTS + 1),
          Object.values(data).pop()!,
        ]);
      }
    });

    const unsubscribeRight = onValue(rightRef, (snapshot) => {
      const data = snapshot.val() as Record<string, FootData> | null;
      if (data) {
        setRightFootProcessed((prev) => [
          ...prev.slice(-MAX_POINTS + 1),
          Object.values(data).pop()!,
        ]);
      }
    });

    return () => {
      unsubscribeLeft();
      unsubscribeRight();
    };
  }, []);

  // ----------------- WebSocket connection -----------------
  useEffect(() => {
    let shouldReconnect = true;

    const connect = () => {
      if (!shouldReconnect) return;
      
      console.log(`Attempting to connect to WebSocket: ${wsUrl}`);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
      };

      wsRef.current.onmessage = (event: MessageEvent) => {
        try {
          const data: WSData = JSON.parse(event.data);
          if (data.asymmetry_index !== undefined) {
            setAsymmetryIndex(data.asymmetry_index);
          }
          if (data.leftFoot) {
            setLeftFootProcessed((prev) => [
              ...prev.slice(-MAX_POINTS + (data.leftFoot?.length || 0)),
              ...(data.leftFoot || []),
            ]);
          }
          if (data.rightFoot) {
            setRightFootProcessed((prev) => [
              ...prev.slice(-MAX_POINTS + (data.rightFoot?.length || 0)),
              ...(data.rightFoot || []),
            ]);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err, 'Data:', event.data);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error occurred:', event);
      };

      wsRef.current.onclose = (event) => {
        console.warn(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
        if (shouldReconnect) {
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [wsUrl]);

  return { leftFootProcessed, rightFootProcessed, asymmetryIndex };
}