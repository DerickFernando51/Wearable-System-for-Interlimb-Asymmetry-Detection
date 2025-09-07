import { useCallback } from "react";
import database from "../firebase";
import { ref, set } from "firebase/database";

export function useRecording() {
  const startRecording = useCallback(() => {
    set(ref(database, "commands/recording"), true).catch((err) =>
      console.error("Failed to start recording:", err)
    );
  }, []);

  const stopRecording = useCallback(() => {
    set(ref(database, "commands/recording"), false).catch((err) =>
      console.error("Failed to stop recording:", err)
    );
  }, []);

  return { startRecording, stopRecording };
}
