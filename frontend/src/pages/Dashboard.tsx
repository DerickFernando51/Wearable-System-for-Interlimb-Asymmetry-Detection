import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import ControlButtons from "../components/ControlButtons";
import useFootData from "../hooks/useFootData";
import { useRecording } from "../hooks/useRecording";
import {
  setLeftFoot,
  setRightFoot,
  setAsymmetryIndex,
} from "../slices/footDataSlice";
import type {
  AccelData,
  GyroData,
  SensorAxis,
  FootDataPoint,
  ForceView,
} from "../types";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import GraphsPanel from "../components/GraphsPanel";
import ContributionPieChart from "../components/PieChart";
import Table from "../components/Table";


function Dashboard() {
  const dispatch = useDispatch();
  const {
    leftFootWS,
    rightFootWS,
    leftFootFirebase,
    rightFootFirebase,
    asymmetryIndex,
    compScore,
    overallStronger,
    accelContribution,
    gyroContribution,
    forceContribution,
  } = useFootData();
  const { startRecording, stopRecording } = useRecording();
  const footDataState = useSelector((state: RootState) => state.footData);
  const uiState = useSelector((state: RootState) => state.ui);

  const [activeView, setActiveView] = useState<"table" | "graphs">("table");

  // Update Redux store with Firebase data for table
  useEffect(() => {
    dispatch(setLeftFoot(leftFootFirebase));
    dispatch(setRightFoot(rightFootFirebase));

    if (asymmetryIndex && typeof asymmetryIndex === "object" && !Array.isArray(asymmetryIndex)) {
      dispatch(setAsymmetryIndex(asymmetryIndex));
    } else {
      dispatch(setAsymmetryIndex(null));
    }

    console.log("Left foot Firebase:", leftFootFirebase);
    console.log("Right foot Firebase:", rightFootFirebase);
  }, [leftFootFirebase, rightFootFirebase, asymmetryIndex, dispatch]);

  // Latest point helper
  const getLatestPoint = (points: FootDataPoint[] | undefined | null) => {
    if (!points || points.length === 0) return null;
    return points[points.length - 1];
  };

  const latestLeft = getLatestPoint(footDataState.leftFoot);
  const latestRight = getLatestPoint(footDataState.rightFoot);

  // Extract sensor value
  const getSensorValue = (
    foot: FootDataPoint | null,
    sensor: "accel" | "gyro" | "force",
    view?: ForceView | keyof AccelData | keyof GyroData,
    axis?: keyof SensorAxis
  ) => {
    if (!foot) return 0;

    const data = foot[sensor as keyof FootDataPoint] as any;
    if (!data) return 0;

    if (sensor === "force") {
      return data ?? 0;
    }

    if (!axis) return 0;
    return data[view ?? "raw"]?.[axis] ?? 0;
  };

  // Table row renderer
  const renderRow = (label: string, leftValue: any, rightValue: any) => (
    <tr key={label} className="table-row">
      <td className="table-cell label">{label}</td>
      <td className="table-cell">{leftValue ?? "—"}</td>
      <td className="table-cell">{rightValue ?? "—"}</td>
    </tr>
  );



  return (
    <div className="dashboard-container">


      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="left-column">
          <div className="dashboard-card">
            <h2>Controls</h2>
            <ControlButtons onStart={startRecording} onStop={stopRecording} />
          </div>

          <div className="dashboard-card">
            <h2>Asymmetry Index</h2>


            <ContributionPieChart
              asymmetryIndex={{
                comp_score: compScore,
                overall_stronger: overallStronger,
                accel_contribution: accelContribution,
                gyro_contribution: gyroContribution,
                force_contribution: forceContribution,
              }}
            />
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
              <div className="horizontal-line"></div>
              {activeView === "table" ? (
                <Table leftFoot={leftFootFirebase} rightFoot={rightFootFirebase} />
              ) : (
                <GraphsPanel leftFootData={leftFootWS} rightFootData={rightFootWS} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;