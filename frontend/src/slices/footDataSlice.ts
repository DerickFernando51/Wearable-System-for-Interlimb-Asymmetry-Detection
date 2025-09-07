import { createSlice } from "@reduxjs/toolkit";
import type {PayloadAction } from "@reduxjs/toolkit";
import type { FootData, AsymmetryIndex } from "../types";

interface FootDataState {
  leftFoot: FootData[];
  rightFoot: FootData[];
  asymmetryIndex: AsymmetryIndex | null;
}

const initialState: FootDataState = {
  leftFoot: [],
  rightFoot: [],
  asymmetryIndex: null,
};

const footDataSlice = createSlice({
  name: "footData",
  initialState,
  reducers: {
    setLeftFoot(state, action: PayloadAction<FootData[]>) {
      state.leftFoot = action.payload;
    },
    setRightFoot(state, action: PayloadAction<FootData[]>) {
      state.rightFoot = action.payload;
    },
    setAsymmetryIndex(state, action: PayloadAction<AsymmetryIndex | null>) {
      state.asymmetryIndex = action.payload;
    },
  },
});

export const { setLeftFoot, setRightFoot, setAsymmetryIndex } = footDataSlice.actions;
export default footDataSlice.reducer;
