import { configureStore } from "@reduxjs/toolkit";
import footDataReducer from "./slices/footDataSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    footData: footDataReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
