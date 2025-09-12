import { createSlice} from "@reduxjs/toolkit";
import type {PayloadAction } from "@reduxjs/toolkit";
import type { FootDataPoint, AsymmetryIndex } from "../types";

interface FootDataState {
  leftFoot: FootDataPoint[];
  rightFoot: FootDataPoint[];
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
    setLeftFoot(state, action: PayloadAction<FootDataPoint[]>) {
      state.leftFoot = action.payload;
    },
    setRightFoot(state, action: PayloadAction<FootDataPoint[]>) {
      state.rightFoot = action.payload;
    },
    setAsymmetryIndex(state, action: PayloadAction<AsymmetryIndex | null>) {
      state.asymmetryIndex = action.payload;
    },
  },
});

export const { setLeftFoot, setRightFoot, setAsymmetryIndex } = footDataSlice.actions;
export default footDataSlice.reducer;
