import { useEffect, useState, useRef } from 'react';
import database from '../firebase';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import type { FootDataPoint, WSData, AsymmetryIndex } from '../types';

export default function useFootData(wsUrl: string = 'ws://localhost:8000/ws/imu') {
  // --- WebSocket Data (for charts) ---
  const [leftFootWS, setLeftFootWS] = useState<FootDataPoint[]>([]);
  const [rightFootWS, setRightFootWS] = useState<FootDataPoint[]>([]);
  const [asymmetryIndex, setAsymmetryIndex] = useState<AsymmetryIndex>(null);

  // --- Firebase Data (for other purposes) ---
  const [leftFootFirebase, setLeftFootFirebase] = useState<FootDataPoint[]>([]);
  const [rightFootFirebase, setRightFootFirebase] = useState<FootDataPoint[]>([]);

  const MAX_POINTS = 60000;
  const wsRef = useRef<WebSocket | null>(null);

  // --- Firebase subscription ---
  useEffect(() => {
    const leftRef = query(ref(database, 'leftFoot'), limitToLast(5));
    const rightRef = query(ref(database, 'rightFoot'), limitToLast(5));

    const unsubscribeLeft = onValue(leftRef, snapshot => {
      const data = snapshot.val() as Record<string, { batch: FootDataPoint[] }> | null;
      if (data) {
        const batches = Object.values(data).flatMap(entry => entry.batch);
        setLeftFootFirebase(prev => [...prev.slice(-MAX_POINTS + batches.length), ...batches]);
      }
    });

    const unsubscribeRight = onValue(rightRef, snapshot => {
      const data = snapshot.val() as Record<string, { batch: FootDataPoint[] }> | null;
      if (data) {
        const batches = Object.values(data).flatMap(entry => entry.batch);
        setRightFootFirebase(prev => [...prev.slice(-MAX_POINTS + batches.length), ...batches]);
      }
    });

    return () => {
      unsubscribeLeft();
      unsubscribeRight();
    };
  }, []);

  // --- WebSocket connection (for charts) ---
  useEffect(() => {
    let shouldReconnect = true;

    const connect = () => {
      if (!shouldReconnect) return;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = event => {
        try {
          const data: WSData = JSON.parse(event.data);
          console.log("WS Data:", data);

          if (data.asymmetry_index) setAsymmetryIndex(data.asymmetry_index);

          if (data.leftFoot?.batch) {
            const newPoints: FootDataPoint[] = data.leftFoot.batch;
            console.log("Left Foot WS batch:", newPoints);

            setLeftFootWS(prev => {
              const updated = [
                ...prev.slice(-MAX_POINTS + newPoints.length),
                ...newPoints,
              ];
              console.log("Left Foot WS updated (state):", updated);
              return updated;
            });
          }


          if (data.rightFoot?.batch) {
            const newPoints: FootDataPoint[] = data.rightFoot.batch;
            console.log("Right Foot WS batch:", newPoints);

            setRightFootWS(prev => {
              const updated = [
                ...prev.slice(-MAX_POINTS + newPoints.length),
                ...newPoints,
              ];
              console.log("Right Foot WS updated (state):", updated);
              return updated;
            });
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

  // --- Return both data sources ---
  return {
    leftFootWS,
    rightFootWS,
    leftFootFirebase,
    rightFootFirebase,
    asymmetryIndex,
  };
}
