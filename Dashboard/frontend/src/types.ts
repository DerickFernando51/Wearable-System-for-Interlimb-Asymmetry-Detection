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
  timestamp: number;  
  force: Record<ForceView, number>;
  accel: AccelData;
  gyro: GyroData;
};



export interface WSData {
  leftFoot?: { batch: FootDataPoint[] };    
  rightFoot?: { batch: FootDataPoint[] };   
  asymmetry_index?: AsymmetryIndex;
}

export interface AsymmetryIndex {
  comp_score?: number;                      // optional
  overall_stronger?: 'left' | 'right' | 'equal'; // optional
  accel_contribution: number;
  gyro_contribution: number;
  force_contribution: number;
}


 

