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
  ResponsiveContainer
} from "recharts";
import "./App.css"; 

function App() {
  const [leftFoot, setLeftFoot] = useState(null);
  const [rightFoot, setRightFoot] = useState(null);
  const [leftFootHistory, setLeftFootHistory] = useState([]);

  const handleStart = () => {
    set(ref(database, "commands/recording"), true);
  };

  const handleStop = () => {
    set(ref(database, "commands/recording"), false);
  };

  useEffect(() => {
    const leftRef = ref(database, "leftFoot");
    const rightRef = ref(database, "rightFoot");

    const unsubscribeLeft = onValue(leftRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = Object.values(data);
        const latest = entries[entries.length - 1];
        setLeftFoot(latest);

        // Store last 50 points for plotting
        const history = entries.map((item, index) => ({
          id: index,
          accel_x: item?.accel?.x || 0,
          accel_y: item?.accel?.y || 0,
          accel_z: item?.accel?.z || 0,
        }));
        setLeftFootHistory(history.slice(-50));
      } else {
        setLeftFoot(null);
        setLeftFootHistory([]);
      }
    });

    const unsubscribeRight = onValue(rightRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = Object.values(data);
        const latest = entries[entries.length - 1];
        setRightFoot(latest);
      } else {
        setRightFoot(null);
      }
    });

    return () => {
      unsubscribeLeft();
      unsubscribeRight();
    };
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
                {renderRow("Timestamp", leftFoot?.timestamp, rightFoot?.timestamp)}
                {renderRow("Force", leftFoot?.force, rightFoot?.force)}

                <tr className="section-row">
                  <td className="section-cell" colSpan="3">
                    Accelerometer
                  </td>
                </tr>
                {renderRow("X", leftFoot?.accel?.x, rightFoot?.accel?.x, "indented")}
                {renderRow("Y", leftFoot?.accel?.y, rightFoot?.accel?.y, "indented")}
                {renderRow("Z", leftFoot?.accel?.z, rightFoot?.accel?.z, "indented")}

                <tr className="section-row">
                  <td className="section-cell" colSpan="3">
                    Angular Velocity
                  </td>
                </tr>
                {renderRow("X", leftFoot?.gyro?.x, rightFoot?.gyro?.x, "indented")}
                {renderRow("Y", leftFoot?.gyro?.y, rightFoot?.gyro?.y, "indented")}
                {renderRow("Z", leftFoot?.gyro?.z, rightFoot?.gyro?.z, "indented")}
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

        {/* Styled Chart Section */}
        <div className="table-wrapper" style={{ marginTop: "30px" }}>
          <div className="section-row">
            <div className="section-cell" style={{ fontWeight: "bold" }}>
              Left Foot Acceleration (X, Y, Z)
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={leftFootHistory}>
                <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" />
                <XAxis dataKey="id" label={{ value: "Sample Index", position: "insideBottom", offset: -5 }} />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: "#f9f9f9", borderRadius: "8px" }} />
                <Legend />
                <Line type="monotone" dataKey="accel_x" stroke="#ff4d4f" strokeWidth={2} name="Accel X" dot={false} />
                <Line type="monotone" dataKey="accel_y" stroke="#52c41a" strokeWidth={2} name="Accel Y" dot={false} />
                <Line type="monotone" dataKey="accel_z" stroke="#1890ff" strokeWidth={2} name="Accel Z" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
