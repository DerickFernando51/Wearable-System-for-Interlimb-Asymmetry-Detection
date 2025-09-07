export type SensorAxis = { x: number; y: number; z: number };

export type AccelData = {
  raw: SensorAxis;
  dcb_removed: SensorAxis;
  median_filtered: SensorAxis;
};

export type GyroData = {
  raw: SensorAxis;
  dcb_removed: SensorAxis;
  median_filtered: SensorAxis;
};

export type ForceView = "raw" | "dcb_removed" | "median_filtered";

export type FootData = {
  timestamp: string;
  force: Record<ForceView, number>;
  accel: AccelData;
  gyro: GyroData;
};

export type AccelView = keyof AccelData;
export type GyroView = keyof GyroData;

export interface WSData {
  leftFoot?: FootData[];
  rightFoot?: FootData[];
  asymmetry_index?: Record<string, number> | null;
}


export type AsymmetryIndex = Record<string, number> | null;

