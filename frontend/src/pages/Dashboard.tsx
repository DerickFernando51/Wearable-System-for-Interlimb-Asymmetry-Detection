import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import ControlButtons from "../components/ControlButtons";
import { useFootData } from "../hooks/useFootData";
import { useRecording } from "../hooks/useRecording";
import {
  setLeftFoot,
  setRightFoot,
  setAsymmetryIndex,
} from "../slices/footDataSlice";
import type { FootData, AccelData, GyroData, SensorAxis } from "../types";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import GraphsPanel from "../components/GraphsPanel";

function Dashboard() {
  const dispatch = useDispatch();
  const { leftFootProcessed, rightFootProcessed, asymmetryIndex } =
    useFootData();
  const { startRecording, stopRecording } = useRecording();
  const footDataState = useSelector((state: RootState) => state.footData);
  const uiState = useSelector((state: RootState) => state.ui);

  const [activeView, setActiveView] = useState<"table" | "graphs">("table");

  // Update Redux store
  useEffect(() => {
    dispatch(setLeftFoot(leftFootProcessed));
    dispatch(setRightFoot(rightFootProcessed));
    if (
      asymmetryIndex &&
      typeof asymmetryIndex === "object" &&
      !Array.isArray(asymmetryIndex)
    ) {
      dispatch(setAsymmetryIndex(asymmetryIndex));
    } else {
      dispatch(setAsymmetryIndex(null));
    }
  }, [leftFootProcessed, rightFootProcessed, asymmetryIndex, dispatch]);

  // Helper: get latest point from batch
 const getLatestPoint = (footData: FootData | undefined | null) => {
  if (!footData) return null;

  let latest: FootDataPoint | null = null;

  Object.values(footData).forEach((entry) => {
    if (!entry.batch || entry.batch.length === 0) return;
    const lastInBatch = entry.batch.at(-1)!;
    if (!latest || parseFloat(lastInBatch.timestamp) > parseFloat(latest.timestamp)) {
      latest = lastInBatch;
    }
  });

  return latest;
};
 const latestLeft = getLatestPoint(footDataState.leftFoot);
const latestRight = getLatestPoint(footDataState.rightFoot);




  // Helper: extract sensor values
  const getSensorValue = (
  foot: FootData | null,
  sensor: "accel" | "gyro" | "force",
  view?: keyof AccelData | keyof GyroData | string,
  axis?: keyof SensorAxis
) => {
  if (!foot) return 0;

  if (sensor === "force") return foot.force ?? 0;
  if (!axis || !foot[sensor]) return 0;
  return (foot[sensor] as any)[axis] ?? 0;
};



  // Table row renderer
  const renderRow = (label: string, leftValue: any, rightValue: any) => (
    <tr key={label} className="table-row">
      <td className="table-cell label">{label}</td>
      <td className="table-cell">{leftValue ?? "—"}</td>
      <td className="table-cell">{rightValue ?? "—"}</td>
    </tr>
  );

  // Pie chart
  const channelValues = [
    { name: "Accelerometer", value: footDataState.asymmetryIndex?.accel ?? 0 },
    { name: "Gyroscope", value: footDataState.asymmetryIndex?.gyro ?? 0 },
    { name: "Force", value: footDataState.asymmetryIndex?.force ?? 0 },
  ];

  const total = channelValues.reduce((sum, entry) => sum + entry.value, 0);
  const pieData = channelValues.map((entry) => ({
    name: entry.name,
    value: total === 0 ? 0 : (entry.value / total) * 100,
  }));

  const COLORS = ["#FA8C16", "#00C49F", "#FFBB28"];

  return (
    <div className="dashboard-container">
      <h1 className="title">
        Wearable System for Interlimb Asymmetry Detection
      </h1>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="left-column">
          <div className="dashboard-card">
            <h2>Controls</h2>
            <ControlButtons onStart={startRecording} onStop={stopRecording} />
          </div>

          <div className="dashboard-card">
            <h2>Asymmetry Index</h2>
            <div className="composite-score-container">
              <span className="composite-score-label">
                Composite Asymmetry Score:
              </span>
              <span className="composite-score-value">10%</span>
            </div>
            <div className="composite-score-container">
              <span className="composite-score-label">Stronger Limb:</span>
              <span className="composite-score-label">Left</span>
            </div>

            <PieChart width={400} height={225}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ value }) => `${value.toFixed(1)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={15} />
              <Tooltip />
            </PieChart>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column">
          <div className="dashboard-card wide-card">
            <div className="realtime-header">
              <h2>Realtime Data</h2>

              <div className="view-toggle-buttons">
                <button
                  className={activeView === "table" ? "active" : ""}
                  onClick={() => setActiveView("table")}
                >
                  Table
                </button>
                <button
                  className={activeView === "graphs" ? "active" : ""}
                  onClick={() => setActiveView("graphs")}
                >
                  Graphs
                </button>
              </div>
            </div>

            <div className="scrollable">
              {activeView === "table" ? (
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
                        latestLeft?.timestamp ?? "-",
                        latestRight?.timestamp ?? "-"
                      )}
                      {renderRow(
                        "Force",
                        getSensorValue(latestLeft, "force", uiState.leftForceView),
                        getSensorValue(latestRight, "force", uiState.rightForceView)
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
                          )
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
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="graphs-wrapper">
                  <GraphsPanel />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
