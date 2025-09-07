import { createSlice } from "@reduxjs/toolkit";
import type {PayloadAction } from "@reduxjs/toolkit";
import type { AccelData, GyroData, ForceView } from "../types";

interface UIState {
  leftAccelView: keyof AccelData;
  rightAccelView: keyof AccelData;
  leftGyroView: keyof GyroData;
  rightGyroView: keyof GyroData;
  leftForceView: ForceView;
  rightForceView: ForceView;
}

const initialState: UIState = {
  leftAccelView: "raw",
  rightAccelView: "raw",
  leftGyroView: "raw",
  rightGyroView: "raw",
  leftForceView: "raw",
  rightForceView: "raw",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLeftAccelView(state, action: PayloadAction<keyof AccelData>) {
      state.leftAccelView = action.payload;
    },
    setRightAccelView(state, action: PayloadAction<keyof AccelData>) {
      state.rightAccelView = action.payload;
    },
    setLeftGyroView(state, action: PayloadAction<keyof GyroData>) {
      state.leftGyroView = action.payload;
    },
    setRightGyroView(state, action: PayloadAction<keyof GyroData>) {
      state.rightGyroView = action.payload;
    },
    setLeftForceView(state, action: PayloadAction<ForceView>) {
      state.leftForceView = action.payload;
    },
    setRightForceView(state, action: PayloadAction<ForceView>) {
      state.rightForceView = action.payload;
    },
  },
});

export const {
  setLeftAccelView,
  setRightAccelView,
  setLeftGyroView,
  setRightGyroView,
  setLeftForceView,
  setRightForceView,
} = uiSlice.actions;
export default uiSlice.reducer;
