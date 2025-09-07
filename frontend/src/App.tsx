import { useState } from "react";
import "./App.css";
import ControlButtons from "./components/ControlButtons";
import { useFootData } from "./hooks/useFootData";
import { useRecording } from "./hooks/useRecording";
import { MemoizedFootChart, MemoizedForceChart } from "./components/Charts";
import type { FootData, ForceView, AccelData, GyroData, SensorAxis } from "./types";

function App() {
  // ----------------- Hooks -----------------
  const { leftFootProcessed, rightFootProcessed, asymmetryIndex } = useFootData();
  const { startRecording, stopRecording } = useRecording();

  // ----------------- Views -----------------
  const [leftAccelView, setLeftAccelView] = useState<keyof AccelData>("raw");
  const [rightAccelView, setRightAccelView] = useState<keyof AccelData>("raw");
  const [leftGyroView, setLeftGyroView] = useState<keyof GyroData>("raw");
  const [rightGyroView, setRightGyroView] = useState<keyof GyroData>("raw");
  const [leftForceView, setLeftForceView] = useState<ForceView>("raw");
  const [rightForceView, setRightForceView] = useState<ForceView>("raw");

  const latestLeft: FootData | null = leftFootProcessed.at(-1) ?? null;
  const latestRight: FootData | null = rightFootProcessed.at(-1) ?? null;

  // ----------------- Helper -----------------
  const getSensorValue = (
    foot: FootData | null,
    sensor: "accel" | "gyro",
    view: keyof AccelData | keyof GyroData,
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

  // ----------------- Render -----------------
  return (
    <div className="container">
      <div className="content">
        <h1 className="title">Wearable Device for Interlimb Asymmetry Detection</h1>

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
                {renderRow("Timestamp", latestLeft?.timestamp, latestRight?.timestamp, "", "timestamp")}
                {renderRow(
                  "Force",
                  latestLeft?.force[leftForceView],
                  latestRight?.force[rightForceView],
                  "",
                  "force"
                )}

                <tr className="section-row">
                  <td className="section-cell" colSpan={3}>Accelerometer</td>
                </tr>
                {(["x", "y", "z"] as const).map((axis) =>
                  renderRow(
                    axis.toUpperCase(),
                    getSensorValue(latestLeft, "accel", leftAccelView, axis),
                    getSensorValue(latestRight, "accel", rightAccelView, axis),
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
            <ControlButtons onStart={startRecording} onStop={stopRecording} />

            {/* Asymmetry Index Display */}
            <div className="asymmetry-display">
              <strong>Asymmetry Index:</strong>
              {asymmetryIndex && typeof asymmetryIndex === "object" ? (
                <table className="asymmetry-table">
                  <thead>
                    <tr>
                      <th>Channel</th>
                      <th>Value (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(asymmetryIndex).map(([key, value]) => (
                      <tr key={key}>
                        <td className="asymmetry-label">{key.replace("_", " ").toUpperCase()}</td>
                        <td className="asymmetry-value">
                          {value !== null && value !== undefined ? `${value.toFixed(2)}%` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <span>-</span>
              )}
            </div>
          </div>
        </div>

        {/* GRAPHS */}
        <div className="graph-section">
          <div className="graph-columns">
            <MemoizedFootChart footData={leftFootProcessed} view={leftAccelView} setView={setLeftAccelView} title="Left Foot Acceleration" type="accel" />
            <MemoizedFootChart footData={rightFootProcessed} view={rightAccelView} setView={setRightAccelView} title="Right Foot Acceleration" type="accel" />
          </div>
          <div className="graph-columns">
            <MemoizedFootChart footData={leftFootProcessed} view={leftGyroView} setView={setLeftGyroView} title="Left Foot Angular Velocity" type="gyro" />
            <MemoizedFootChart footData={rightFootProcessed} view={rightGyroView} setView={setRightGyroView} title="Right Foot Angular Velocity" type="gyro" />
          </div>
          <div className="graph-columns">
            <MemoizedForceChart footData={leftFootProcessed} title="Left Foot Force" view={leftForceView} setView={setLeftForceView} />
            <MemoizedForceChart footData={rightFootProcessed} title="Right Foot Force" view={rightForceView} setView={setRightForceView} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
