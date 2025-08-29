import React, { useEffect, useState } from "react";
import database from "./firebase.ts";
import { ref, set, onValue } from "firebase/database";
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
import "./App.css";

interface WSData {
  leftFoot?: FootData[];
  rightFoot?: FootData[];
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

  const handleStart = () => {
    set(ref(database, "commands/recording"), true);
  };

  const handleStop = () => {
    set(ref(database, "commands/recording"), false);
  };

  // Real-time table (Firebase subscription)
  useEffect(() => {
    const leftRef = ref(database, "leftFoot");
    const rightRef = ref(database, "rightFoot");

    const unsubscribeLeft = onValue(leftRef, (snapshot) => {
      const data = snapshot.val() as Record<string, FootData> | null;
      if (data) {
        const entries = Object.values(data);
        setLeftFoot(entries[entries.length - 1]);
      } else setLeftFoot(null);
    });

    const unsubscribeRight = onValue(rightRef, (snapshot) => {
      const data = snapshot.val() as Record<string, FootData> | null;
      if (data) {
        const entries = Object.values(data);
        setRightFoot(entries[entries.length - 1]);
      } else setRightFoot(null);
    });

    return () => {
      unsubscribeLeft();
      unsubscribeRight();
    };
  }, []);

  // Real-time graphs (WebSocket)
  // useEffect(() => {
  //   if (typeof window === "undefined") return; // handle unit tests

  //   const ws = new WebSocket("ws://localhost:8000/ws/imu");

  //   ws.onmessage = (event: MessageEvent) => {
  //     try {
  //       const data: WSData = JSON.parse(event.data);
  //       if (data.leftFoot) setLeftFootProcessed(data.leftFoot);
  //       if (data.rightFoot) setRightFootProcessed(data.rightFoot);
  //     } catch (err) {
  //       console.error("Invalid JSON received:", event.data);
  //     }
  //   };

  //   ws.onclose = () => console.log("WebSocket closed");

  //   return () => ws.close();
  // }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/imu");

    ws.onmessage = (event: MessageEvent) => {
      const data: WSData = JSON.parse(event.data);
      if (data.leftFoot) setLeftFootProcessed(data.leftFoot);
      if (data.rightFoot) setRightFootProcessed(data.rightFoot);
    };

    ws.onclose = () => console.log("WebSocket closed");

    return () => ws.close();
  }, []);


  const viewOptions = [
    { value: "raw", label: "Raw Data" },
    { value: "dcb_removed", label: "DC Bias Removed" },
    { value: "median_filtered", label: "Median Filtered" },
  ];

  const getSensorValue = (
    foot: FootData | null,
    sensor: "accel" | "gyro",
    view: AccelView | GyroView,
    axis: keyof SensorAxis
  ) => {
    if (!foot) return 0;

    const data = sensor === "accel" ? foot.accel : foot.gyro;
    return data[view][axis];
  };

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
                {/* Timestamp and Force */}
                {renderRow(
                  "Timestamp",
                  leftFoot?.timestamp,
                  rightFoot?.timestamp,
                  "",
                  "timestamp"
                )}
                {renderRow(
                  "Force",
                  leftFoot?.force,
                  rightFoot?.force,
                  "",
                  "force"
                )}

                {/* Accelerometer Section */}
                <tr className="section-row" key="accel-section">
                  <td className="section-cell" colSpan={3}>
                    Accelerometer
                  </td>
                </tr>
                {(["x", "y", "z"] as (keyof SensorAxis)[]).map((axis) =>
                  renderRow(
                    axis.toUpperCase(),
                    getSensorValue(leftFoot, "accel", leftAccelView, axis),
                    getSensorValue(rightFoot, "accel", rightAccelView, axis),
                    "indented",
                    `accel-${axis}`
                  )
                )}

                {/* Gyroscope Section */}
                <tr className="section-row" key="gyro-section">
                  <td className="section-cell" colSpan={3}>
                    Angular Velocity
                  </td>
                </tr>
                {(["x", "y", "z"] as (keyof SensorAxis)[]).map((axis) =>
                  renderRow(
                    axis.toUpperCase(),
                    getSensorValue(leftFoot, "gyro", leftGyroView, axis),
                    getSensorValue(rightFoot, "gyro", rightGyroView, axis),
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
          </div>
        </div>

        {/* GRAPHS */}
        <div className="graph-section">
          <div className="graph-columns">
            {/* LEFT FOOT ACCEL */}
            <FootChart
              footData={leftFootProcessed}
              view={leftAccelView}
              setView={setLeftAccelView}
              title="Left Foot Acceleration"
              type="accel"
            />
            {/* RIGHT FOOT ACCEL */}
            <FootChart
              footData={rightFootProcessed}
              view={rightAccelView}
              setView={setRightAccelView}
              title="Right Foot Acceleration"
              type="accel"
            />
          </div>

          <div className="graph-columns">
            {/* LEFT FOOT GYRO */}
            <FootChart
              footData={leftFootProcessed}
              view={leftGyroView}
              setView={setLeftGyroView}
              title="Left Foot Angular Velocity"
              type="gyro"
            />
            {/* RIGHT FOOT GYRO */}
            <FootChart
              footData={rightFootProcessed}
              view={rightGyroView}
              setView={setRightGyroView}
              title="Right Foot Angular Velocity"
              type="gyro"
            />
          </div>
          <div className="graph-columns">
            {/* LEFT FOOT FORCE */}
            <ForceChart
              footData={leftFootProcessed}
              title="Left Foot Force"
              view={leftForceView}
              setView={setLeftForceView}
            />
            {/* RIGHT FOOT FORCE */}
            <ForceChart
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

// Reusable chart components
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

  const getValue = (d: FootData, axis: keyof SensorAxis) => {
    return d[type]?.[view]?.[axis] ?? 0;
  };

  return (
    <div className="graph-column">
      <div className="graph-header flex items-center gap-4">
        <h2 className="graph-title text-lg font-semibold whitespace-nowrap">
          {title}
        </h2>
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

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={footData} className="line-chart-container">
          <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
            label={{ value: "Time", position: "insideBottomRight", offset: -5 }}
          />
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
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.9)",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />
          {(["x", "y", "z"] as (keyof SensorAxis)[]).map((axis) => (
            <Line
              key={`${title}-${axis}`}
              type="monotone"
              dataKey={(d: FootData) => getValue(d, axis)}
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
    </div>
  );
};

type ForceView = "raw" | "dcb_removed" | "median_filtered";

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

  const getValue = (d: FootData) => {
    return d.force?.[view] ?? 0;
  };

  return (
    <div className="graph-column">
      <div className="graph-header flex items-center gap-4">
        <h2 className="graph-title text-lg font-semibold whitespace-nowrap">
          {title}
        </h2>
        <div className="graph-controls">
          <div className="select-wrapper relative">
            <select
              value={view}
              onChange={(e) => setView(e.target.value as ForceView)}
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

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={footData} className="line-chart-container">
          <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
            label={{ value: "Time", position: "insideBottomRight", offset: -5 }}
          />
          <YAxis
            label={{
              value: "Force (N)", // adjust unit if needed
              angle: -90,
              position: "insideLeft",
            }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.9)",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />
          <Line
            type="monotone"
            dataKey={getValue}
            stroke="#1890ff"
            name={`Force (${viewOptions.find((o) => o.value === view)?.label})`}
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default App;
