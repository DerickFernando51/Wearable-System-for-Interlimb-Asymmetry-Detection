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

export type FootDataPoint = {
  timestamp: number; // ✅ backend sends float, not string
  force: Record<ForceView, number>;
  accel: AccelData;
  gyro: GyroData;
};

export type AsymmetryIndex = Record<string, number> | null;

export interface WSData {
  leftFoot?: { batch: FootDataPoint[] };    
  rightFoot?: { batch: FootDataPoint[] };   
  asymmetry_index?: AsymmetryIndex;
}
