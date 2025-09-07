import { useEffect, useState, useRef } from "react";
import database from "../firebase";
import { ref, onValue, query, limitToLast } from "firebase/database";
import type { FootData, WSData } from "../types";

export function useFootData(wsUrl: string = "ws://localhost:8000/ws/imu") {
  const [leftFootProcessed, setLeftFootProcessed] = useState<FootData[]>([]);
  const [rightFootProcessed, setRightFootProcessed] = useState<FootData[]>([]);
  const [asymmetryIndex, setAsymmetryIndex] = useState<number | Record<string, number> | null>(null);

  const MAX_POINTS = 200;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // ----------------- Firebase subscription -----------------
  useEffect(() => {
    const leftRef = query(ref(database, "leftFoot"), limitToLast(1));
    const rightRef = query(ref(database, "rightFoot"), limitToLast(1));

    const unsubscribeLeft = onValue(leftRef, (snapshot) => {
      const data = snapshot.val() as Record<string, FootData> | null;
      if (data) setLeftFootProcessed((prev) => [
        ...prev.slice(-MAX_POINTS + 1),
        Object.values(data).pop()!,
      ]);
    });

    const unsubscribeRight = onValue(rightRef, (snapshot) => {
      const data = snapshot.val() as Record<string, FootData> | null;
      if (data) setRightFootProcessed((prev) => [
        ...prev.slice(-MAX_POINTS + 1),
        Object.values(data).pop()!,
      ]);
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
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data: WSData = JSON.parse(event.data);

          if (data.asymmetry_index !== undefined) {
            setAsymmetryIndex(data.asymmetry_index);
          }

          if (data.leftFoot) {
            setLeftFootProcessed((prev) => [
              ...prev.slice(-MAX_POINTS + data.leftFoot!.length),
              ...data.leftFoot!,
            ]);
          }

          if (data.rightFoot) {
            setRightFootProcessed((prev) => [
              ...prev.slice(-MAX_POINTS + data.rightFoot!.length),
              ...data.rightFoot!,
            ]);
          }
        } catch (err) {
          console.error("Invalid JSON received:", event.data);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.onclose = (event) => {
        console.warn(`WebSocket closed (code: ${event.code}). Reconnecting...`);
        if (shouldReconnect) {
          reconnectTimeout.current = setTimeout(connect, 2000); // retry in 2 sec
        }
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [wsUrl]);

  return { leftFootProcessed, rightFootProcessed, asymmetryIndex };
}
