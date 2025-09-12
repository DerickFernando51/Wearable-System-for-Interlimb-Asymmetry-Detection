import { useEffect, useState, useRef } from 'react';
import database from '../firebase';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import type { FootDataPoint, WSData, AsymmetryIndex } from '../types';

export default function useFootData(wsUrl: string = 'ws://localhost:8000/ws/imu') {
  const [leftFootProcessed, setLeftFootProcessed] = useState<FootDataPoint[]>([]);
  const [rightFootProcessed, setRightFootProcessed] = useState<FootDataPoint[]>([]);
  const [asymmetryIndex, setAsymmetryIndex] = useState<AsymmetryIndex>(null);
  const MAX_POINTS = 200;
  const wsRef = useRef<WebSocket | null>(null);

  // Firebase subscription
  useEffect(() => {
    const leftRef = query(ref(database, 'leftFoot'), limitToLast(1));
    const rightRef = query(ref(database, 'rightFoot'), limitToLast(1));

    const unsubscribeLeft = onValue(leftRef, snapshot => {
      const data = snapshot.val() as Record<string, { batch: FootDataPoint[] }> | null;
      if (data) {
        const batches = Object.values(data).flatMap(entry => entry.batch);
        setLeftFootProcessed(prev => [...prev.slice(-MAX_POINTS + batches.length), ...batches]);
      }
    });

    const unsubscribeRight = onValue(rightRef, snapshot => {
      const data = snapshot.val() as Record<string, { batch: FootDataPoint[] }> | null;
      if (data) {
        const batches = Object.values(data).flatMap(entry => entry.batch);
        setRightFootProcessed(prev => [...prev.slice(-MAX_POINTS + batches.length), ...batches]);
      }
    });

    return () => {
      unsubscribeLeft();
      unsubscribeRight();
    };
  }, []);

  // WebSocket connection
  useEffect(() => {
    let shouldReconnect = true;

    const connect = () => {
      if (!shouldReconnect) return;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = event => {
        try {
          const data: WSData = JSON.parse(event.data);

          if (data.asymmetry_index) setAsymmetryIndex(data.asymmetry_index);

          if (data.leftFoot) {
            const batches = Object.values(data.leftFoot).flatMap(entry => entry.batch);
            setLeftFootProcessed(prev => [...prev.slice(-MAX_POINTS + batches.length), ...batches]);
          }

          if (data.rightFoot) {
            const batches = Object.values(data.rightFoot).flatMap(entry => entry.batch);
            setRightFootProcessed(prev => [...prev.slice(-MAX_POINTS + batches.length), ...batches]);
          }
        } catch (err) {
          console.error('WebSocket parse error:', err);
        }
      };

      wsRef.current.onclose = () => {
        if (shouldReconnect) setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      wsRef.current?.close();
    };
  }, [wsUrl]);

  return { leftFootProcessed, rightFootProcessed, asymmetryIndex };
}
