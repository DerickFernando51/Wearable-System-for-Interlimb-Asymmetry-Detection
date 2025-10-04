import React, { useMemo } from "react";
import type { ReactNode } from "react";
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

import type {
  FootDataPoint,
  ForceView,
  AccelData,
  GyroData,
  SensorAxis,
} from "../types";
import "../App.css";

// ---------------- FOOT CHART ----------------
interface FootChartProps {
  footData: FootDataPoint[];
  view: keyof AccelData | keyof GyroData;
  setView: (view: keyof AccelData | keyof GyroData) => void;
  title: ReactNode;
  type: "accel" | "gyro";
}

export const FootChart = ({
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



  const handleViewChange = (newView: keyof AccelData | keyof GyroData) => {
    setView(newView);
  };



  const chart = useMemo(
    () => (
      <ResponsiveContainer key={`${view}-${footData.length}`} width="100%" height={350}>
        <LineChart className="line-chart-container" data={footData}>
          <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fill: "#475569", fontSize: 12 }}
            label={{ value: "Time (s)", position: "insideBottom", offset: 0, fill: "#1e293b", fontSize: 12, fontWeight: 500, }} />
          <YAxis
            tick={{ fill: "#475569", fontSize: 12 }}
            label={{
              value:
                type === "accel"
                  ? "Acceleration (m/s²)"
                  : "Angular Velocity (°/s)",
              angle: -90,
              position: "insideLeft",
              fill: "#1e293b",
              fontSize: 12,
              fontWeight: 500,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#1e293b" }} />
          {(["x", "y", "z"] as (keyof SensorAxis)[]).map((axis) => (
            <Line
              key={axis}
              type="monotone"
              dataKey={(d: FootDataPoint) => {
                const sensorData = d[type] as AccelData | GyroData;
                const axisData = sensorData[view] as SensorAxis | undefined;
                return axisData?.[axis] ?? 0;
              }}
              stroke={
                axis === "x" ? "#ff4d4f" : axis === "y" ? "#52c41a" : "#1890ff"
              }
              name={`${type === "accel" ? "Accel" : "Gyro"
                } ${axis.toUpperCase()}`}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
         ),
    [footData, view, type]
    
  );

  return (
    <div className="graph-column">
      <div className="graph-header">
        <h2 className="graph-title">{title}</h2>
        <div className="graph-controls">
          <div className="select-wrapper relative">
            <select
              value={view}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleViewChange(e.target.value as keyof AccelData | keyof GyroData)
              }
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

export const MemoizedFootChart = React.memo(FootChart);

// ---------------- FORCE CHART ----------------
interface ForceChartProps {
  footData: FootDataPoint[];
  title: ReactNode;
  view: ForceView;
  setView: (view: ForceView) => void;
}

export const ForceChart = ({
  footData,
  title,
  view,
  setView,
}: ForceChartProps) => {
  const viewOptions: { value: ForceView; label: string }[] = [
    { value: "raw", label: "Raw" },
    { value: "dcb_removed", label: "DC Bias Removed" },
    { value: "median_filtered", label: "Median Filtered" },
  ];

  const handleViewChange = (v: ForceView) => setView(v);

  const chart = useMemo(
    () => (
     
      <ResponsiveContainer key={`${view}-${footData.length}`} width="100%" height={350}>
        <LineChart className="line-chart-container" data={footData}>
          <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fill: "#475569", fontSize: 12 }}
            label={{ value: "Time (s)", position: "insideBottom", offset: 0, fill: "#1e293b", fontSize: 12, fontWeight: 500, }} />
          <YAxis
            tick={{ fill: "#475569", fontSize: 12 }}
            label={{
              value: "Force (ADC Units)",
              angle: -90,
              position: "insideLeft",
              fill: "#1e293b",
              fontSize: 12,
              fontWeight: 500,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#1e293b" }} />
          <Line
            type="monotone"
            dataKey={(d: FootDataPoint) => {
              const f = d.force;
              if (f == null) return 0;

              // Nested object
              if (typeof f === "object") {
                return f[view] ?? 0;
              }

              // Flat number
              return f;
            }}
            stroke="#1890ff"
            name="Force"
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
      <div className="graph-header">
        <h2 className="graph-title">{title}</h2>
        <div className="graph-controls">
          <div className="select-wrapper relative">

            <select
              value={view}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleViewChange(e.target.value as ForceView)
              }
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

export const MemoizedForceChart = React.memo(ForceChart);