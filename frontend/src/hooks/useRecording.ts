import { useCallback } from "react";
import database from "../firebase";
import { ref, set } from "firebase/database";


export function useRecording() {
  const startRecording = useCallback(() => {
    set(ref(database, "commands/recording"), true).catch(console.error);
  }, []);

  const stopRecording = useCallback(() => {
    set(ref(database, "commands/recording"), false).catch(console.error);
  }, []);

  return { startRecording, stopRecording };
}
