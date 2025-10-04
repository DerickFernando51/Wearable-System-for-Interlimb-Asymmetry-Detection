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

  return (
    <div className="graph-section">
      {/* Acceleration */}
      <div className="graph-columns">
        <MemoizedFootChart
          footData={leftFootData}
          view={uiState.leftAccelView}
          setView={(v) => dispatch(setLeftAccelView(v))}
          title="Left Foot Acceleration"
          type="accel"
        />
        <MemoizedFootChart
          footData={rightFootData}
          view={uiState.rightAccelView}
          setView={(v) => dispatch(setRightAccelView(v))}
          title="Right Foot Acceleration"
          type="accel"
        />
      </div>

      {/* Angular Velocity */}
      <div className="graph-columns">
        <MemoizedFootChart
          footData={leftFootData}
          view={uiState.leftGyroView}
          setView={(v) => dispatch(setLeftGyroView(v))}
          title="Left Foot Angular Velocity"
          type="gyro"
        />
        <MemoizedFootChart
          footData={rightFootData}
          view={uiState.rightGyroView}
          setView={(v) => dispatch(setRightGyroView(v))}
          title="Right Foot Angular Velocity"
          type="gyro"
        />
      </div>

      {/* Force */}
      <div className="graph-columns">
        <MemoizedForceChart
          footData={leftFootData}
          view={uiState.leftForceView}
          setView={(v) => dispatch(setLeftForceView(v))}
          title="Left Foot Force"
        />
        <MemoizedForceChart
          footData={rightFootData}
          view={uiState.rightForceView}
          setView={(v) => dispatch(setRightForceView(v))}
          title="Right Foot Force"
        />
      </div>
    </div>
  );
};

export default GraphsPanel;