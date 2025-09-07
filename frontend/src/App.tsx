import React from "react";
import "./App.css";
import ControlButtons from "./components/ControlButtons";
import { useFootData } from "./hooks/useFootData";
import { useRecording } from "./hooks/useRecording";
import { MemoizedFootChart, MemoizedForceChart } from "./components/Charts";
import type {
  FootData,
  ForceView,
  AccelData,
  GyroData,
  SensorAxis,
} from "./types";

import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "./store";
import {
  setLeftAccelView,
  setRightAccelView,
  setLeftGyroView,
  setRightGyroView,
  setLeftForceView,
  setRightForceView,
} from "./slices/uiSlice";
import {
  setLeftFoot,
  setRightFoot,
  setAsymmetryIndex,
} from "./slices/footDataSlice";

function App() {
  const dispatch = useDispatch();

  // ----------------- Foot Data -----------------
  const { leftFootProcessed, rightFootProcessed, asymmetryIndex } =
    useFootData();

  // Update Redux store whenever foot data changes
  React.useEffect(() => {
    dispatch(setLeftFoot(leftFootProcessed));
    dispatch(setRightFoot(rightFootProcessed));

    // Only dispatch if asymmetryIndex is a proper object
    if (
      asymmetryIndex &&
      typeof asymmetryIndex === "object" &&
      !Array.isArray(asymmetryIndex)
    ) {
      dispatch(setAsymmetryIndex(asymmetryIndex));
    } else {
      dispatch(setAsymmetryIndex(null)); // fallback
    }
  }, [leftFootProcessed, rightFootProcessed, asymmetryIndex, dispatch]);

  const footDataState = useSelector((state: RootState) => state.footData);
  const uiState = useSelector((state: RootState) => state.ui);

  const latestLeft: FootData | null = footDataState.leftFoot.at(-1) ?? null;
  const latestRight: FootData | null = footDataState.rightFoot.at(-1) ?? null;

  const { startRecording, stopRecording } = useRecording();

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
                  latestLeft?.force[uiState.leftForceView],
                  latestRight?.force[uiState.rightForceView],
                  "",
                  "force"
                )}

                <tr className="section-row">
                  <td className="section-cell" colSpan={3}>
                    Accelerometer
                  </td>
                </tr>
                {(["x", "y", "z"] as const).map((axis) =>
                  renderRow(
                    axis.toUpperCase(),
                    getSensorValue(
                      latestLeft,
                      "accel",
                      uiState.leftAccelView,
                      axis
                    ),
                    getSensorValue(
                      latestRight,
                      "accel",
                      uiState.rightAccelView,
                      axis
                    ),
                    "indented",
                    `accel-${axis}`
                  )
                )}

                <tr className="section-row">
                  <td className="section-cell" colSpan={3}>
                    Angular Velocity
                  </td>
                </tr>
                {(["x", "y", "z"] as const).map((axis) =>
                  renderRow(
                    axis.toUpperCase(),
                    getSensorValue(
                      latestLeft,
                      "gyro",
                      uiState.leftGyroView,
                      axis
                    ),
                    getSensorValue(
                      latestRight,
                      "gyro",
                      uiState.rightGyroView,
                      axis
                    ),
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
              {footDataState.asymmetryIndex &&
              typeof footDataState.asymmetryIndex === "object" ? (
                <table className="asymmetry-table">
                  <thead>
                    <tr>
                      <th>Channel</th>
                      <th>Value (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(footDataState.asymmetryIndex).map(
                      ([key, value]) => (
                        <tr key={key}>
                          <td className="asymmetry-label">
                            {key.replace("_", " ").toUpperCase()}
                          </td>
                          <td className="asymmetry-value">
                            {value !== null && value !== undefined
                              ? `${value.toFixed(2)}%`
                              : "-"}
                          </td>
                        </tr>
                      )
                    )}
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
            <MemoizedFootChart
              footData={footDataState.leftFoot}
              view={uiState.leftAccelView}
              setView={(vOrFn) => {
                const newValue =
                  typeof vOrFn === "function"
                    ? vOrFn(uiState.leftAccelView)
                    : vOrFn;
                dispatch(setLeftAccelView(newValue));
              }}
              title="Left Foot Acceleration"
              type="accel"
            />
            <MemoizedFootChart
              footData={footDataState.rightFoot}
              view={uiState.rightAccelView}
              setView={(vOrFn) => {
                const newValue =
                  typeof vOrFn === "function"
                    ? vOrFn(uiState.rightAccelView)
                    : vOrFn;
                dispatch(setRightAccelView(newValue));
              }}
              title="Right Foot Acceleration"
              type="accel"
            />
          </div>
          <div className="graph-columns">
            <MemoizedFootChart
              footData={footDataState.leftFoot}
              view={uiState.leftGyroView}
              setView={(vOrFn) => {
                const newValue =
                  typeof vOrFn === "function"
                    ? vOrFn(uiState.leftGyroView)
                    : vOrFn;
                dispatch(setLeftGyroView(newValue));
              }}
              title="Left Foot Angular Velocity"
              type="gyro"
            />
            <MemoizedFootChart
              footData={footDataState.rightFoot}
              view={uiState.rightGyroView}
              setView={(vOrFn) => {
                const newValue =
                  typeof vOrFn === "function"
                    ? vOrFn(uiState.rightGyroView)
                    : vOrFn;
                dispatch(setRightGyroView(newValue));
              }}
              title="Right Foot Angular Velocity"
              type="gyro"
            />
          </div>
          <div className="graph-columns">
            <MemoizedForceChart
              footData={footDataState.leftFoot}
              title="Left Foot Force"
              view={uiState.leftForceView}
              setView={(v) => dispatch(setLeftForceView(v))}
            />
            <MemoizedForceChart
              footData={footDataState.rightFoot}
              title="Right Foot Force"
              view={uiState.rightForceView}
              setView={(v) => dispatch(setRightForceView(v))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
