import { useEffect, useState, useRef, useMemo } from 'react';
import database from '../firebase';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import type { FootDataPoint, WSData, AsymmetryIndex } from '../types';

export default function useFootData(wsUrl: string = 'ws://localhost:8000/ws/imu') {
  // --- WebSocket Data ---
  const [leftFootWS, setLeftFootWS] = useState<FootDataPoint[]>([]);
  const [rightFootWS, setRightFootWS] = useState<FootDataPoint[]>([]);

  // --- Firebase Data ---
  const [leftFootFirebase, setLeftFootFirebase] = useState<FootDataPoint[]>([]);
  const [rightFootFirebase, setRightFootFirebase] = useState<FootDataPoint[]>([]);

  // --- Asymmetry contributions ---
  const [compScore, setCompScore] = useState<number | undefined>(undefined);
  const [overallStronger, setOverallStronger] = useState<'left' | 'right' | 'equal' | undefined>(undefined);
  const [accelContribution, setAccelContribution] = useState<number>(0);
  const [gyroContribution, setGyroContribution] = useState<number>(0);
  const [forceContribution, setForceContribution] = useState<number>(0);

  const MAX_POINTS = 60000;
  const wsRef = useRef<WebSocket | null>(null);

  // --- Firebase subscriptions ---
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

  const lastLeftTimestamp = useRef(0);
  const lastRightTimestamp = useRef(0);


  // --- WebSocket connection ---
  useEffect(() => {
    let shouldReconnect = true;

    const connect = () => {
      if (!shouldReconnect) return;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = event => {
        try {
          const data: WSData & {
            comp_score?: number;
            overall_stronger?: 'left' | 'right' | 'equal';
            accel_contribution?: number;
            gyro_contribution?: number;
            force_contribution?: number;
            asymmetry_index?: Record<string, number>;
            stronger_foot?: Record<string, 'Left' | 'Right' | 'Equal'>;
          } = JSON.parse(event.data);

          if (data.comp_score !== undefined) {
            setCompScore(data.comp_score);
          } else {
            setCompScore(undefined);
          }

          if (data.overall_stronger) {
            setOverallStronger(data.overall_stronger);
          } else {
            setOverallStronger(undefined);
          }
          if (data.accel_contribution !== undefined) setAccelContribution(data.accel_contribution);
          if (data.gyro_contribution !== undefined) setGyroContribution(data.gyro_contribution);
          if (data.force_contribution !== undefined) setForceContribution(data.force_contribution);

          if (data.asymmetry_index) console.log("[WS Update] Asymmetry Index:", data.asymmetry_index);
          if (data.stronger_foot) console.log("[WS Update] Stronger Foot:", data.stronger_foot);


          
          // Left foot
          if (data.leftFoot?.batch) {
            const newPoints = data.leftFoot.batch.filter(p => p.timestamp > lastLeftTimestamp.current);
            if (newPoints.length > 0) {
              lastLeftTimestamp.current = newPoints[newPoints.length - 1].timestamp;
              setLeftFootWS(prev => [...prev, ...newPoints]);
            }
          }

          // Right foot
          if (data.rightFoot?.batch) {
            const newPoints = data.rightFoot.batch.filter(p => p.timestamp > lastRightTimestamp.current);
            if (newPoints.length > 0) {
              lastRightTimestamp.current = newPoints[newPoints.length - 1].timestamp;
              setRightFootWS(prev => [...prev, ...newPoints]);
            }
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

  // --- Memoized asymmetry index ---
  const asymmetryIndex: AsymmetryIndex | null = useMemo(() => ({
    comp_score: compScore,
    overall_stronger: overallStronger,
    accel_contribution: accelContribution,
    gyro_contribution: gyroContribution,
    force_contribution: forceContribution,
  }), [compScore, overallStronger, accelContribution, gyroContribution, forceContribution]);

  // --- Return data ---
  return {
    leftFootWS,
    rightFootWS,
    leftFootFirebase,
    rightFootFirebase,
    asymmetryIndex,
    compScore,
    overallStronger,
    accelContribution,
    gyroContribution,
    forceContribution,
  };
}