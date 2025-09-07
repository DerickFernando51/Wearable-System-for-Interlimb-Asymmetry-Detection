import React from "react";
import { ref, remove } from "firebase/database";
import database from "../firebase";

export interface ControlButtonsProps {
  onStart: () => void;
  onStop: () => void;
  onReset?: () => void; // optional, can also handle custom reset
}

const ControlButtons: React.FC<ControlButtonsProps> = ({ onStart, onStop, onReset }) => {
  const handleReset = () => {
    // Call optional external onReset if provided
    if (onReset) {
      onReset();
      return;
    }

    // Default reset behavior
    onStop(); // stop recording first

    // Remove leftFoot and rightFoot data
    remove(ref(database, "leftFoot"))
      .then(() => console.log("Left foot data deleted"))
      .catch((err) => console.error("Error deleting left foot:", err));

    remove(ref(database, "rightFoot"))
      .then(() => console.log("Right foot data deleted"))
      .catch((err) => console.error("Error deleting right foot:", err));
  };

  return (
    <div className="button-panel">
      <button className="control-button start" onClick={onStart}>
        Start
      </button>
      <button className="control-button stop" onClick={onStop}>
        Stop
      </button>
      <button className="control-button reset" onClick={handleReset}>
        Reset
      </button>
    </div>
  );
};

export default ControlButtons;
