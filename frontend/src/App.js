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
  const [leftView, setLeftView] = useState("raw");
  const [rightView, setRightView] = useState("raw");

  const handleStart = () => {
    set(ref(database, "commands/recording"), true);
  };

  const handleStop = () => {
    set(ref(database, "commands/recording"), false);
  };

  //Real-time table (Firebase subscription)
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
        
        {/* GRAPHS */}
        <div className="graph-section">
          <div className="graph-columns">
            {/* LEFT FOOT */}
            <div className="graph-column">
              <h2 className="graph-title">Left Foot Acceleration</h2>

              {/* Dropdown */}
              <div className="graph-controls">
                <label className="mr-2">View:</label>
                <select
                  value={leftView}
                  onChange={(e) => setLeftView(e.target.value)}
                >
                  <option value="raw">Raw</option>
                  <option value="dcb_removed">DC Bias Removed</option>
                  <option value="median_filtered">Median Filtered</option>
                </select>
              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={leftFootProcessed}
                  className="line-chart-container"
                >
                  <CartesianGrid stroke="#ccc" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={`${leftView}.x`}
                    stroke="#ff4d4f"
                    name="Accel X"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${leftView}.y`}
                    stroke="#52c41a"
                    name="Accel Y"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${leftView}.z`}
                    stroke="#1890ff"
                    name="Accel Z"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* RIGHT FOOT */}
            <div className="graph-column">
              <h2 className="graph-title">Right Foot Acceleration</h2>

              {/* Dropdown */}
              <div className="graph-controls">
                <label className="mr-2">View:</label>
                <select
                  value={rightView}
                  onChange={(e) => setRightView(e.target.value)}
                >
                  <option value="raw">Raw</option>
                  <option value="dcb_removed">DC Bias Removed</option>
                  <option value="median_filtered">Median Filtered</option>
                </select>
              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={rightFootProcessed}
                  className="line-chart-container"
                >
                  <CartesianGrid stroke="#ccc" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={`${rightView}.x`}
                    stroke="#ff4d4f"
                    name="Accel X"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${rightView}.y`}
                    stroke="#52c41a"
                    name="Accel Y"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${rightView}.z`}
                    stroke="#1890ff"
                    name="Accel Z"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        ); }
      </div>
    </div>
  );
}

export default App;
