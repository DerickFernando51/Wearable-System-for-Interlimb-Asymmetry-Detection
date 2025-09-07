import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import type { FootData, AccelData, GyroData, SensorAxis } from "../types";

function TablePage() {
  const footDataState = useSelector((state: RootState) => state.footData);
  const uiState = useSelector((state: RootState) => state.ui);

  const latestLeft: FootData | null = footDataState.leftFoot.at(-1) ?? null;
  const latestRight: FootData | null = footDataState.rightFoot.at(-1) ?? null;

  const getSensorValue = (
    foot: FootData | null,
    sensor: "accel" | "gyro" | "force",
    view?: keyof AccelData | keyof GyroData | string,
    axis?: keyof SensorAxis
  ) => {
    if (!foot) return 0;
    const data = foot[sensor as keyof FootData] as any;
    if (!data) return 0;
    if (sensor === "force") return typeof data === "number" ? data : data[view as string] ?? 0;
    if (!view || !axis) return 0;
    return data[view]?.[axis] ?? 0;
  };

  const renderRow = (label: string, leftValue: any, rightValue: any, className = "", key?: string) => (
    <tr key={key ?? label} className={`table-row ${className}`}>
      <td className="table-cell label">{label}</td>
      <td className="table-cell">{leftValue ?? "—"}</td>
      <td className="table-cell">{rightValue ?? "—"}</td>
    </tr>
  );

  return (
    <div className="container">
      <div className="content">
        <h1 className="title">Real-Time Foot Sensor Data</h1>

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
                {renderRow("Timestamp", latestLeft?.timestamp ?? "-", latestRight?.timestamp ?? "-", "", "timestamp")}
                {renderRow(
                  "Force",
                  getSensorValue(latestLeft, "force", uiState.leftForceView),
                  getSensorValue(latestRight, "force", uiState.rightForceView),
                  "",
                  "force"
                )}

                <tr className="section-row">
                  <td className="section-cell" colSpan={3}>Accelerometer</td>
                </tr>
                {(["x", "y", "z"] as const).map((axis) =>
                  renderRow(
                    axis.toUpperCase(),
                    getSensorValue(latestLeft, "accel", uiState.leftAccelView, axis),
                    getSensorValue(latestRight, "accel", uiState.rightAccelView, axis),
                    "indented",
                    `accel-${axis}`
                  )
                )}

                <tr className="section-row">
                  <td className="section-cell" colSpan={3}>Angular Velocity</td>
                </tr>
                {(["x", "y", "z"] as const).map((axis) =>
                  renderRow(
                    axis.toUpperCase(),
                    getSensorValue(latestLeft, "gyro", uiState.leftGyroView, axis),
                    getSensorValue(latestRight, "gyro", uiState.rightGyroView, axis),
                    "indented",
                    `gyro-${axis}`
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TablePage;
