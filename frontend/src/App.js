import React, { useEffect, useState } from "react";
import database from "./firebase";
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

function App() {
  const [leftFoot, setLeftFoot] = useState(null);
  const [rightFoot, setRightFoot] = useState(null);
  const [leftFootProcessed, setLeftFootProcessed] = useState([]);
  const [rightFootProcessed, setRightFootProcessed] = useState([]);
  const [leftAccelView, setLeftAccelView] = useState("raw");
  const [rightAccelView, setRightAccelView] = useState("raw");
  const [leftGyroView, setLeftGyroView] = useState("raw");
  const [rightGyroView, setRightGyroView] = useState("raw");

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
      const data = snapshot.val();
      if (data) {
        const entries = Object.values(data);
        setLeftFoot(entries[entries.length - 1]);
      } else setLeftFoot(null);
    });

    const unsubscribeRight = onValue(rightRef, (snapshot) => {
      const data = snapshot.val();
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

  // Real-time graphs (web socket)
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/imu");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.leftFoot) setLeftFootProcessed(data.leftFoot);
      if (data.rightFoot) setRightFootProcessed(data.rightFoot);
    };

    ws.onclose = () => console.log("WebSocket closed");

    return () => ws.close();
  }, []);

  const renderRow = (label, leftValue, rightValue, className = "") => (
    <tr className={`table-row ${className}`}>
      <td className="table-cell label">{label}</td>
      <td className="table-cell">{leftValue ?? "—"}</td>
      <td className="table-cell">{rightValue ?? "—"}</td>
    </tr>
  );

  // View options
  const viewOptions = [
    {
      value: "raw",
      label: "Raw Data",
    },
    {
      value: "dcb_removed",
      label: "DC Bias Removed",
    },
    {
      value: "median_filtered",
      label: "Median Filtered",
    },
  ];

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
                  leftFoot?.timestamp,
                  rightFoot?.timestamp
                )}
                {renderRow("Force", leftFoot?.force, rightFoot?.force)}

                <tr className="section-row">
                  <td className="section-cell" colSpan="3">
                    Accelerometer
                  </td>
                </tr>
                {renderRow(
                  "X",
                  leftFoot?.accel?.x,
                  rightFoot?.accel?.x,
                  "indented"
                )}
                {renderRow(
                  "Y",
                  leftFoot?.accel?.y,
                  rightFoot?.accel?.y,
                  "indented"
                )}
                {renderRow(
                  "Z",
                  leftFoot?.accel?.z,
                  rightFoot?.accel?.z,
                  "indented"
                )}

                <tr className="section-row">
                  <td className="section-cell" colSpan="3">
                    Angular Velocity
                  </td>
                </tr>
                {renderRow(
                  "X",
                  leftFoot?.gyro?.x,
                  rightFoot?.gyro?.x,
                  "indented"
                )}
                {renderRow(
                  "Y",
                  leftFoot?.gyro?.y,
                  rightFoot?.gyro?.y,
                  "indented"
                )}
                {renderRow(
                  "Z",
                  leftFoot?.gyro?.z,
                  rightFoot?.gyro?.z,
                  "indented"
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
        <br></br>
        <br></br>

        {/* GRAPHS */}
        <div className="graph-section">
          <div className="graph-columns">
            {/* LEFT FOOT ACCEL */}
            <div className="graph-column">
              <div className="graph-header flex items-center gap-4">
                <h2 className="graph-title text-lg font-semibold whitespace-nowrap">
                  Right Foot Acceleration
                </h2>
                <div className="graph-controls">
                  <div className="select-wrapper relative">
                    <select
                      id="right-accel-view-select"
                      value={rightAccelView}
                      onChange={(e) => setRightAccelView(e.target.value)}
                      className="view-select border rounded px-2 py-1"
                    >
                      {viewOptions.map((option) => (
                        <option
                          key={`right-accel-${option.value}`}
                          value={option.value}
                        >
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

              {/* Chart */}
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={leftFootProcessed}
                  className="line-chart-container"
                >
                  <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Time",
                      position: "insideBottomRight",
                      offset: -5,
                    }}
                  />
                  <YAxis
                    label={{
                      value: "Acceleration (m/s²)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  <Line
                    type="monotone"
                    dataKey={`accel.${leftAccelView}.x`}
                    stroke="#ff4d4f"
                    name="Accel X"
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`accel.${leftAccelView}.y`}
                    stroke="#52c41a"
                    name="Accel Y"
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`accel.${leftAccelView}.z`}
                    stroke="#1890ff"
                    name="Accel Z"
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* RIGHT FOOT ACCEL */}
            <div className="graph-column">
              <div className="graph-header flex items-center gap-4">
                <h2 className="graph-title text-lg font-semibold whitespace-nowrap">
                  Left Foot Acceleration
                </h2>
                <div className="graph-controls">
                  <div className="select-wrapper relative">
                    <select
                      id="left-accel-view-select"
                      value={leftAccelView}
                      onChange={(e) => setLeftAccelView(e.target.value)}
                      className="view-select border rounded px-2 py-1"
                    >
                      {viewOptions.map((option) => (
                        <option
                          key={`left-accel-${option.value}`}
                          value={option.value}
                        >
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

              {/* Chart */}
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={rightFootProcessed}
                  className="line-chart-container"
                >
                  <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Time",
                      position: "insideBottomRight",
                      offset: -5,
                    }}
                  />
                  <YAxis
                    label={{
                      value: "Acceleration (m/s²)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  <Line
                    type="monotone"
                    dataKey={`accel.${rightAccelView}.x`}
                    stroke="#ff4d4f"
                    name="Accel X"
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`accel.${rightAccelView}.y`}
                    stroke="#52c41a"
                    name="Accel Y"
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`accel.${rightAccelView}.z`}
                    stroke="#1890ff"
                    name="Accel Z"
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <br></br>

          <div className="graph-columns">
            {/* LEFT FOOT  GYRO*/}
            <div className="graph-column">
              <div className="graph-header flex items-center gap-4">
                <h2 className="graph-title text-lg font-semibold whitespace-nowrap">
                  Left Foot Angular Velocity
                </h2>

                {/* Dropdown */}
                <div className="graph-controls">
                  <div className="select-wrapper relative">
                    <select
                      id="left-gyro-view-select"
                      value={leftGyroView}
                      onChange={(e) => setLeftGyroView(e.target.value)}
                      className="view-select border rounded px-2 py-1"
                    >
                      {viewOptions.map((option) => (
                        <option
                          key={`left-gyro-${option.value}`}
                          value={option.value}
                        >
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

              {/* Chart */}
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={leftFootProcessed}
                  className="line-chart-container"
                >
                  <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Time",
                      position: "insideBottomRight",
                      offset: -5,
                    }}
                  />
                  <YAxis
                    label={{
                      value: "Angular Velocity (°/s)", // Change label for gyro
                      angle: -90,
                      position: "insideLeft",
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px" }} />

                  <Line
                    type="monotone"
                    dataKey={`gyro.${leftGyroView}.x`}
                    stroke="#ff4d4f"
                    name="Gyro X"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey={`gyro.${leftGyroView}.y`}
                    stroke="#52c41a"
                    name="Gyro Y"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey={`gyro.${leftGyroView}.z`}
                    stroke="#1890ff"
                    name="Gyro Z"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* RIGHT FOOT GYRO*/}
            <div className="graph-column">
              <div className="graph-header flex items-center gap-4">
                <h2 className="graph-title text-lg font-semibold whitespace-nowrap">
                  Right Foot Angular Velocity
                </h2>
                <div className="graph-controls">
                  <div className="select-wrapper relative">
                    <select
                      id="right-gyro-view-select"
                      value={rightGyroView}
                      onChange={(e) => setRightGyroView(e.target.value)}
                      className="view-select border rounded px-2 py-1"
                    >
                      {viewOptions.map((option) => (
                        <option
                          key={`right-gyro-${option.value}`}
                          value={option.value}
                        >
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

              {/* Chart */}
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={rightFootProcessed}
                  className="line-chart-container"
                >
                  <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Time",
                      position: "insideBottomRight",
                      offset: -5,
                    }}
                  />
                  <YAxis
                    label={{
                      value: "Angular Velocity (°/s)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  <Line
                    type="monotone"
                    dataKey={`gyro.${rightGyroView}.x`}
                    stroke="#ff4d4f"
                    name="Gyro X"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey={`gyro.${rightGyroView}.y`}
                    stroke="#52c41a"
                    name="Gyro Y"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey={`gyro.${rightGyroView}.z`}
                    stroke="#1890ff"
                    name="Gyro Z"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <br></br>
          <br></br>
        </div>
      </div>
    </div>
  );
}

export default App;
