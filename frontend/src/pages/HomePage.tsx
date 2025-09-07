import React from "react";
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

function HomePage() {
  const dispatch = useDispatch();
  const { leftFootProcessed, rightFootProcessed, asymmetryIndex } =
    useFootData();
  const { startRecording, stopRecording } = useRecording();
  const footDataState = useSelector((state: RootState) => state.footData);
  const uiState = useSelector((state: RootState) => state.ui);

  // Update Redux store when foot data changes
  React.useEffect(() => {
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

    // Force data might just be a number
    if (sensor === "force")
      return typeof data === "number" ? data : data[view as string] ?? 0;

    if (!view || !axis) return 0;
    return data[view]?.[axis] ?? 0;
  };

  const renderRow = (label: string, leftValue: any, rightValue: any) => (
    <tr key={label} className="table-row">
      <td className="table-cell label">{label}</td>
      <td className="table-cell">{leftValue ?? "—"}</td>
      <td className="table-cell">{rightValue ?? "—"}</td>
    </tr>
  );

  const channelValues = [
    { name: "Accelerometer", value: footDataState.asymmetryIndex?.accel ?? 0 },
    { name: "Gyroscope", value: footDataState.asymmetryIndex?.gyro ?? 0 },
    { name: "Force", value: footDataState.asymmetryIndex?.force ?? 0 },
  ];

  // Compute total for percentages
  const total = channelValues.reduce((sum, entry) => sum + entry.value, 0);

  // Convert to percentages for pie chart
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
          {/* Controls */}
          <div className="dashboard-card">
            <h2>Controls</h2>
            <ControlButtons onStart={startRecording} onStop={stopRecording} />
          </div>

          {/* Asymmetry Index */}
          <div className="dashboard-card">
            <h2>Asymmetry Index</h2>
            <div className="composite-score-container">
              <span className="composite-score-label">
                Composite Asymmetry Score:
              </span>
              <span className="composite-score-value">10%</span>
            </div>

            <PieChart width={400} height={250}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({  value }) => `${value.toFixed(1)}%`}
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

        {/* Right Column: Realtime Data */}
        <div className="right-column">
          <div className="dashboard-card wide-card">
            <h2>Realtime Data</h2>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
