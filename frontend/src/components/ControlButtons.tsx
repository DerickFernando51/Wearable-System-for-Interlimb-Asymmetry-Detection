import React from "react";
import { ref, set, remove } from "firebase/database";
import database from "../firebase";

interface ControlButtonsProps {}

const ControlButtons: React.FC<ControlButtonsProps> = () => {
  const handleStart = () => {
    set(ref(database, "commands/recording"), true);
  };

  const handleStop = () => {
    set(ref(database, "commands/recording"), false);
  };

  const handleReset = () => {
    // Stop recording first
    set(ref(database, "commands/recording"), false);

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
      <button className="control-button start" onClick={handleStart}>
        Start
      </button>
      <button className="control-button stop" onClick={handleStop}>
        Stop
      </button>
      <button className="control-button reset" onClick={handleReset}>
        Reset
      </button>
    </div>
  );
};

export default ControlButtons;
