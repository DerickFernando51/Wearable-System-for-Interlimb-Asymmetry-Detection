import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";
import { MemoizedFootChart, MemoizedForceChart } from "./Charts";
import type { FootDataPoint } from "../types";
import {
  setLeftAccelView,
  setRightAccelView,
  setLeftGyroView,
  setRightGyroView,
  setLeftForceView,
  setRightForceView,
} from "../slices/uiSlice";

interface GraphsPanelProps {
  leftFootData: FootDataPoint[];
  rightFootData: FootDataPoint[];
}

const GraphsPanel: React.FC<GraphsPanelProps> = ({ leftFootData, rightFootData }) => {
  const dispatch = useDispatch();
    const uiState = useSelector((state: RootState) => state.ui);
console.log("GraphsPanel received leftFootData:", leftFootData);
console.log("GraphsPanel received rightFootData:", rightFootData);


  return (
    <div className="graph-section">
      {/* Acceleration */}
      <div className="graph-columns">
        <MemoizedFootChart
          footData={leftFootData}
          view={uiState.leftAccelView}
          setView={(v) =>
            dispatch(setLeftAccelView(typeof v === "function" ? v(uiState.leftAccelView) : v))
          }
          title={<span className="chart-title">Left Foot Acceleration</span>}
          type="accel"
        />
        <MemoizedFootChart
          footData={rightFootData}
          view={uiState.rightAccelView}
          setView={(v) =>
            dispatch(setRightAccelView(typeof v === "function" ? v(uiState.rightAccelView) : v))
          }
          title={<span className="chart-title">Right Foot Acceleration</span>}
          type="accel"
        />
      </div>

      {/* Angular velocity */}
      <div className="graph-columns">
        <MemoizedFootChart
          footData={leftFootData}
          view={uiState.leftGyroView}
          setView={(v) =>
            dispatch(setLeftGyroView(typeof v === "function" ? v(uiState.leftGyroView) : v))
          }
          title={<span className="chart-title">Left Foot Angular Velocity</span>}
          type="gyro"
        />
        <MemoizedFootChart
          footData={rightFootData}
          view={uiState.rightGyroView}
          setView={(v) =>
            dispatch(setRightGyroView(typeof v === "function" ? v(uiState.rightGyroView) : v))
          }
          title={<span className="chart-title">Right Foot Angular Velocity</span>}
          type="gyro"
        />
      </div>

      {/* Force */}
      <div className="graph-columns">
        <MemoizedForceChart
          footData={leftFootData}
          view={uiState.leftForceView}
          setView={(v) => dispatch(setLeftForceView(v))}
          title={<span className="chart-title">Left Foot Force</span>}
        />
        <MemoizedForceChart
          footData={rightFootData}
          view={uiState.rightForceView}
          setView={(v) => dispatch(setRightForceView(v))}
          title={<span className="chart-title">Right Foot Force</span>}
        />
      </div>
    </div>
  );
};

export default GraphsPanel;
