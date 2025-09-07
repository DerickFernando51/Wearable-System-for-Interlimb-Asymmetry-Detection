import React, { useMemo, useCallback } from "react";
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
import type {
  FootData,
  ForceView,
  AccelData,
  GyroData,
  SensorAxis,
} from "../types";
import "../App.css";

// ---------------- FOOT CHART ----------------
interface FootChartProps {
  footData: FootData[];
  view: keyof AccelData | keyof GyroData;
  setView: React.Dispatch<
    React.SetStateAction<keyof AccelData | keyof GyroData>
  >;
  title: string;
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

  const handleViewChange = useCallback(
    debounce(
      (newView: keyof AccelData | keyof GyroData) => setView(newView),
      100
    ),
    []
  );

  const chart = useMemo(
    () => (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart className="line-chart-container" data={footData}>
          <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tick={{ fill: "#475569", fontSize: 12 }} />
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
              dataKey={(d: FootData) => d?.[type]?.[view]?.[axis] ?? 0}
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
              onChange={(e) =>
                setView(e.target.value as keyof AccelData | keyof GyroData)
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
  footData: FootData[];
  title: string;
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

  const handleViewChange = useCallback(
    debounce((v: ForceView) => setView(v), 100),
    []
  );

  const chart = useMemo(
    () => (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart className="line-chart-container" data={footData}>
          <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tick={{ fill: "#475569", fontSize: 12 }} />
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
            dataKey={(d: FootData) => d.force[view]}
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
      {chart}
    </div>
  );
};

export const MemoizedForceChart = React.memo(ForceChart);
