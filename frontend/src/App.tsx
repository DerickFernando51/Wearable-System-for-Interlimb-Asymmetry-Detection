import React, { useEffect, useState, useMemo, useCallback } from "react";
import database from "./firebase.ts";
import { ref, set, onValue, query, limitToLast } from "firebase/database";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { debounce } from "lodash";
import "./App.css";

interface WSData {
  leftFoot?: FootData[];
  rightFoot?: FootData[];
  asymmetry_index?: number;
}

type SensorAxis = { x: number; y: number; z: number };

type AccelData = {
  raw: SensorAxis;
  dcb_removed: SensorAxis;
  median_filtered: SensorAxis;
};
type GyroData = {
  raw: SensorAxis;
  dcb_removed: SensorAxis;
  median_filtered: SensorAxis;
};

type FootData = {
  timestamp: string;
  force: Record<ForceView, number>;
  accel: AccelData;
  gyro: GyroData;
};

type AccelView = keyof AccelData;
type GyroView = keyof GyroData;
type ForceView = "raw" | "dcb_removed" | "median_filtered";

const MAX_POINTS = 200;

function App() {
  const [leftFoot, setLeftFoot] = useState<FootData | null>(null);
  const [rightFoot, setRightFoot] = useState<FootData | null>(null);
  const [leftFootProcessed, setLeftFootProcessed] = useState<FootData[]>([]);
  const [rightFootProcessed, setRightFootProcessed] = useState<FootData[]>([]);
  const [leftAccelView, setLeftAccelView] = useState<AccelView>("raw");
  const [rightAccelView, setRightAccelView] = useState<AccelView>("raw");
  const [leftGyroView, setLeftGyroView] = useState<GyroView>("raw");
  const [rightGyroView, setRightGyroView] = useState<GyroView>("raw");
  const [leftForceView, setLeftForceView] = useState<ForceView>("raw");
  const [rightForceView, setRightForceView] = useState<ForceView>("raw");
  const [asymmetryIndex, setAsymmetryIndex] = useState<number | null>(null);
  const latestLeft = leftFootProcessed.at(-1) ?? null;
  const latestRight = rightFootProcessed.at(-1) ?? null;

  const handleStart = () => set(ref(database, "commands/recording"), true);
  const handleStop = () => set(ref(database, "commands/recording"), false);

  // Firebase subscription - real time table
  useEffect(() => {
    const leftRef = query(ref(database, "leftFoot"), limitToLast(1));
    const rightRef = query(ref(database, "rightFoot"), limitToLast(1));

    const unsubscribeLeft = onValue(leftRef, (snapshot) => {
      const data = snapshot.val() as Record<string, FootData> | null;
      if (data) setLeftFoot(Object.values(data).pop()!);
      else setLeftFoot(null);
    });

    const unsubscribeRight = onValue(rightRef, (snapshot) => {
      const data = snapshot.val() as Record<string, FootData> | null;
      if (data) setRightFoot(Object.values(data).pop()!);
      else setRightFoot(null);
    });

    return () => {
      unsubscribeLeft();
      unsubscribeRight();
    };
  }, []);

  // WebSocket - real-time graphs
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/imu");

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: WSData = JSON.parse(event.data);
        if (data.asymmetry_index !== undefined) {
          setAsymmetryIndex(data.asymmetry_index);
        }
        if (data.leftFoot)
          setLeftFootProcessed((prev) => [
            ...prev.slice(-MAX_POINTS + data.leftFoot.length),
            ...data.leftFoot,
          ]);
        if (data.rightFoot)
          setRightFootProcessed((prev) => [
            ...prev.slice(-MAX_POINTS + data.rightFoot.length),
            ...data.rightFoot,
          ]);
      } catch (err) {
        console.error("Invalid JSON received:", event.data);
      }
    };

    ws.onclose = () => console.log("WebSocket closed");
    return () => ws.close();
  }, []);

  const getSensorValue = (
    foot: FootData | null,
    sensor: "accel" | "gyro",
    view: AccelView | GyroView,
    axis: keyof SensorAxis
  ) => (foot ? foot[sensor]?.[view]?.[axis] ?? 0 : 0);

  const renderRow = (
    label: string,
    leftValue: any,
    rightValue: any,
    className = "",
    key?: string
  ) => (
    <tr key={key} className={`table-row ${className}`}>
      <td className="table-cell label">{label}</td>
      <td className="table-cell">{leftValue ?? "—"}</td>
      <td className="table-cell">{rightValue ?? "—"}</td>
    </tr>
  );

  return (
    <div className="container">
      <div className="content">
        <h1 className="title">
          Wearable Device for Interlimb Asymmetry Detection
        </h1>

        {/* Table + Buttons */}
        <div className="table-button-container">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr className="table-header">
                  <th className="header-cell rounded-left">Data</th>
                  <th className="header-cell">Left Foot</th>
                  <th className="header-cell rounded-right">Right Foot</th>
                </tr>
              </thead>
              <tbody>
                {renderRow(
                  "Timestamp",
                  latestLeft?.timestamp,
                  latestRight?.timestamp,
                  "",
                  "timestamp"
                )}
                {renderRow(
                  "Force",
                  latestLeft?.force[leftForceView],
                  latestRight?.force[rightForceView],
                  "",
                  "force"
                )}
                <tr className="section-row">
                  <td className="section-cell" colSpan={3}>
                    Accelerometer
                  </td>
                </tr>
                {(["x", "y", "z"] as (keyof SensorAxis)[]).map((axis) =>
                  renderRow(
                    axis.toUpperCase(),
                    getSensorValue(latestLeft, "accel", leftAccelView, axis),
                    getSensorValue(latestRight, "accel", rightAccelView, axis),
                    "indented",
                    `accel-${axis}`
                  )
                )}
                <tr className="section-row">
                  <td className="section-cell" colSpan={3}>
                    Angular Velocity
                  </td>
                </tr>
                {(["x", "y", "z"] as (keyof SensorAxis)[]).map((axis) =>
                  renderRow(
                    axis.toUpperCase(),
                    getSensorValue(latestLeft, "gyro", leftGyroView, axis),
                    getSensorValue(latestRight, "gyro", rightGyroView, axis),
                    "indented",
                    `gyro-${axis}`
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="button-panel">
            <button className="control-button start" onClick={handleStart}>
              Start
            </button>
            <button className="control-button stop" onClick={handleStop}>
              Stop
            </button>
            {/* Asymmetry Index Display */}
            <div className="asymmetry-display">
              <strong>Asymmetry Index:</strong>
              {asymmetryIndex && typeof asymmetryIndex === "object" ? (
                <table className="asymmetry-table">
                  <thead>
                    <tr>
                      <th style={{ color: "black" }}>Channel</th>
                      <th style={{ color: "black" }}>Value (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(asymmetryIndex).map(([key, value]) => (
                      <tr key={key}>
                        <td
                          className="asymmetry-label"
                          style={{ color: "black", fontWeight: "bold" }}
                        >
                          {key.replace("_", " ").toUpperCase()}
                        </td>
                        <td
                          className="asymmetry-value"
                          style={{ color: "black" }}
                        >
                          {value !== null && value !== undefined
                            ? `${value.toFixed(2)}%`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <span style={{ color: "black" }}>-</span>
              )}
            </div>
          </div>
        </div>

        {/* GRAPHS */}
        <div className="graph-section">
          <div className="graph-columns">
            <MemoizedFootChart
              footData={leftFootProcessed}
              view={leftAccelView}
              setView={setLeftAccelView}
              title="Left Foot Acceleration"
              type="accel"
            />
            <MemoizedFootChart
              footData={rightFootProcessed}
              view={rightAccelView}
              setView={setRightAccelView}
              title="Right Foot Acceleration"
              type="accel"
            />
          </div>
          <div className="graph-columns">
            <MemoizedFootChart
              footData={leftFootProcessed}
              view={leftGyroView}
              setView={setLeftGyroView}
              title="Left Foot Angular Velocity"
              type="gyro"
            />
            <MemoizedFootChart
              footData={rightFootProcessed}
              view={rightGyroView}
              setView={setRightGyroView}
              title="Right Foot Angular Velocity"
              type="gyro"
            />
          </div>
          <div className="graph-columns">
            <MemoizedForceChart
              footData={leftFootProcessed}
              title="Left Foot Force"
              view={leftForceView}
              setView={setLeftForceView}
            />
            <MemoizedForceChart
              footData={rightFootProcessed}
              title="Right Foot Force"
              view={rightForceView}
              setView={setRightForceView}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- FOOT CHART ----------------
interface FootChartProps {
  footData: FootData[];
  view: AccelView | GyroView;
  setView: React.Dispatch<React.SetStateAction<AccelView | GyroView>>;
  title: string;
  type: "accel" | "gyro";
}

const FootChart = ({
  footData,
  view,
  setView,
  title,
  type,
}: FootChartProps) => {
  const viewOptions = [
    { value: "raw", label: "Raw Data" },
    { value: "dcb_removed", label: "DC Bias Removed" },
    { value: "median_filtered", label: "Median Filtered" },
  ];

  const handleViewChange = useCallback(
    debounce((newView: AccelView | GyroView) => setView(newView), 100),
    []
  );

  const chart = useMemo(
    () => (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart className="line-chart-container" data={footData}>
          <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
          <YAxis
            label={{
              value:
                type === "accel"
                  ? "Acceleration (m/s²)"
                  : "Angular Velocity (°/s)",
              angle: -90,
              position: "insideLeft",
            }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Legend />
          {(["x", "y", "z"] as (keyof SensorAxis)[]).map((axis) => (
            <Line
              key={axis}
              type="monotone"
              dataKey={(d: FootData) => d[type]?.[view]?.[axis] ?? 0}
              stroke={
                axis === "x" ? "#ff4d4f" : axis === "y" ? "#52c41a" : "#1890ff"
              }
              name={`${
                type === "accel" ? "Accel" : "Gyro"
              } ${axis.toUpperCase()}`}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    ),
    [footData, view]
  );

  return (
    <div className="graph-column">
      <div className="graph-header flex items-center gap-4">
        <h2 className="graph-title">{title}</h2>
        <div className="graph-controls">
          <div className="select-wrapper relative">
            <select
              value={view}
              onChange={(e) => setView(e.target.value as AccelView | GyroView)}
              className="view-select border rounded px-2 py-1"
            >
              {viewOptions.map((option) => (
                <option key={`${title}-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="select-arrow absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              ▼
            </div>
          </div>
        </div>
      </div>
      {chart}
    </div>
  );
};

const MemoizedFootChart = React.memo(FootChart);

// ---------------- FORCE CHART ----------------
interface ForceChartProps {
  footData: FootData[];
  title: string;
  view: ForceView;
  setView: (view: ForceView) => void;
}

const ForceChart = ({ footData, title, view, setView }: ForceChartProps) => {
  const viewOptions = [
    { value: "raw", label: "Raw" },
    { value: "dcb_removed", label: "DC Bias Removed" },
    { value: "median_filtered", label: "Median Filtered" },
  ];

  const handleViewChange = useCallback(
    debounce((v: ForceView) => setView(v), 100),
    []
  );

  const chart = useMemo(
    () => (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart className="line-chart-container" data={footData}>
          <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
          <YAxis
            label={{
              value: "Force (ADC Units)",
              angle: -90,
              position: "insideLeft",
            }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={(d: FootData) => d.force?.[view] ?? 0}
            stroke="#1890ff"
            name={`Force`}
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    ),
    [footData, view]
  );

  return (
    <div className="graph-column">
      <div className="graph-header flex items-center gap-4">
        <h2 className="graph-title">{title}</h2>
        <div className="graph-controls">
          <div className="select-wrapper relative">
            <select
              value={view}
              onChange={(e) => setView(e.target.value as AccelView | GyroView)}
              className="view-select border rounded px-2 py-1"
            >
              {viewOptions.map((option) => (
                <option key={`${title}-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="select-arrow absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              ▼
            </div>
          </div>
        </div>
      </div>
      {chart}
    </div>
  );
};

const MemoizedForceChart = React.memo(ForceChart);

export default App;
