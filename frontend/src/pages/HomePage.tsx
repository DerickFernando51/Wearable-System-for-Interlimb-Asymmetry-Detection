import React from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import ControlButtons from "../components/ControlButtons";
import { useFootData } from "../hooks/useFootData";
import { useRecording } from "../hooks/useRecording";
import { setLeftFoot, setRightFoot, setAsymmetryIndex } from "../slices/footDataSlice";

function HomePage() {
  const dispatch = useDispatch();
  const { leftFootProcessed, rightFootProcessed, asymmetryIndex } = useFootData();
  const { startRecording, stopRecording } = useRecording();
  const footDataState = useSelector((state: RootState) => state.footData);

  // Update Redux store
  React.useEffect(() => {
    dispatch(setLeftFoot(leftFootProcessed));
    dispatch(setRightFoot(rightFootProcessed));
    if (asymmetryIndex && typeof asymmetryIndex === "object" && !Array.isArray(asymmetryIndex)) {
      dispatch(setAsymmetryIndex(asymmetryIndex));
    } else {
      dispatch(setAsymmetryIndex(null));
    }
  }, [leftFootProcessed, rightFootProcessed, asymmetryIndex, dispatch]);

  return (
    <div className="container">
      <div className="content" style={{ textAlign: "center", paddingTop: "50px" }}>
        <h1 className="title">Wearable Device for Interlimb Asymmetry Detection</h1>

        <div style={{ margin: "40px 0" }}>
          <ControlButtons onStart={startRecording} onStop={stopRecording} />
        </div>

        <div className="asymmetry-display" style={{ marginTop: "30px" }}>
          <strong>Asymmetry Index:</strong>
          {footDataState.asymmetryIndex && typeof footDataState.asymmetryIndex === "object" ? (
            <table className="asymmetry-table" style={{ margin: "20px auto" }}>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Value (%)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(footDataState.asymmetryIndex).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key.replace("_", " ").toUpperCase()}</td>
                    <td>{value !== null && value !== undefined ? `${value.toFixed(2)}%` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>-</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
