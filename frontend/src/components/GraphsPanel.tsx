import React from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { MemoizedFootChart, MemoizedForceChart } from "./Charts";
import {
  setLeftAccelView,
  setRightAccelView,
  setLeftGyroView,
  setRightGyroView,
  setLeftForceView,
  setRightForceView,
} from "../slices/uiSlice";

const GraphsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const footDataState = useSelector((state: RootState) => state.footData);
  const uiState = useSelector((state: RootState) => state.ui);

  return (
    <div className="graph-section">
      <div className="graph-columns">
        <MemoizedFootChart
          footData={footDataState.leftFoot}
          view={uiState.leftAccelView}
          setView={(v) =>
            dispatch(
              setLeftAccelView(
                typeof v === "function" ? v(uiState.leftAccelView) : v
              )
            )
          }
          title="Left Foot Acceleration"
          type="accel"
        />
        <MemoizedFootChart
          footData={footDataState.rightFoot}
          view={uiState.rightAccelView}
          setView={(v) =>
            dispatch(
              setRightAccelView(
                typeof v === "function" ? v(uiState.rightAccelView) : v
              )
            )
          }
          title="Right Foot Acceleration"
          type="accel"
        />
      </div>

      <div className="graph-columns">
        <MemoizedFootChart
          footData={footDataState.leftFoot}
          view={uiState.leftGyroView}
          setView={(v) =>
            dispatch(
              setLeftGyroView(
                typeof v === "function" ? v(uiState.leftGyroView) : v
              )
            )
          }
          title="Left Foot Angular Velocity"
          type="gyro"
        />
        <MemoizedFootChart
          footData={footDataState.rightFoot}
          view={uiState.rightGyroView}
          setView={(v) =>
            dispatch(
              setRightGyroView(
                typeof v === "function" ? v(uiState.rightGyroView) : v
              )
            )
          }
          title="Right Foot Angular Velocity"
          type="gyro"
        />
      </div>

      <div className="graph-columns">
        <MemoizedForceChart
          footData={footDataState.leftFoot}
          view={uiState.leftForceView}
          setView={(v) => dispatch(setLeftForceView(v))}
          title="Left Foot Force"
        />
        <MemoizedForceChart
          footData={footDataState.rightFoot}
          view={uiState.rightForceView}
          setView={(v) => dispatch(setRightForceView(v))}
          title="Right Foot Force"
        />
      </div>
    </div>
  );
};

export default GraphsPanel;
