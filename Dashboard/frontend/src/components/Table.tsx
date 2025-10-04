import type {
  FootDataPoint,
  AccelData,
  GyroData,
  SensorAxis,
  ForceView,
} from "../types";
import type { RootState } from "../store";
import { useSelector } from "react-redux";

type Props = {
  leftFoot: FootDataPoint[] | null | undefined;
  rightFoot: FootDataPoint[] | null | undefined;
};

// Helpers
const getLatestPoint = (points: FootDataPoint[] | undefined | null) => {
  if (!points || points.length === 0) return null;
  return points[points.length - 1];
};

const getSensorValue = (
  foot: FootDataPoint | null,
  sensor: "accel" | "gyro" | "force",
  view?: ForceView | keyof AccelData | keyof GyroData,
  axis?: keyof SensorAxis
) => {
  if (!foot) return 0;

  const data = foot[sensor as keyof FootDataPoint] as any;
  if (!data) return 0;

  if (sensor === "force") {
    return data ?? 0;
  }

  if (!axis) return 0;
  return data[view ?? "raw"]?.[axis] ?? 0;
};

const renderRow = (label: string, leftValue: any, rightValue: any) => (
  <tr key={label} className="table-row">
    <td className="table-cell label">{label}</td>
    <td className="table-cell">{leftValue ?? "—"}</td>
    <td className="table-cell">{rightValue ?? "—"}</td>
  </tr>
);

export default function Table({ leftFoot, rightFoot }: Props) {
  const uiState = useSelector((state: RootState) => state.ui);

  const latestLeft = getLatestPoint(leftFoot);
  const latestRight = getLatestPoint(rightFoot);

  return (
      <div className="table-wrapper">
           
      <table className="data-table">
        <thead>
          <tr className="table-header">
            <th className="header-cell rounded-left">Data</th>
            <th className="header-cell">Left Foot</th>
            <th className="header-cell rounded-right">Right Foot</th>
          </tr>
        </thead>
        <tbody>
          {renderRow(
            "Timestamp",
            latestLeft?.timestamp ?? "-",
            latestRight?.timestamp ?? "-"
          )}
          {renderRow(
            "Force",
            getSensorValue(latestLeft, "force", uiState.leftForceView),
            getSensorValue(latestRight, "force", uiState.rightForceView)
          )}

          <tr className="section-row">
            <td className="section-cell" colSpan={3}>
              Accelerometer
            </td>
          </tr>
          {(["x", "y", "z"] as const).map((axis) =>
            renderRow(
              axis.toUpperCase(),
              getSensorValue(latestLeft, "accel", uiState.leftAccelView, axis),
              getSensorValue(latestRight, "accel", uiState.rightAccelView, axis)
            )
          )}

          <tr className="section-row">
            <td className="section-cell" colSpan={3}>
              Angular Velocity
            </td>
          </tr>
          {(["x", "y", "z"] as const).map((axis) =>
            renderRow(
              axis.toUpperCase(),
              getSensorValue(latestLeft, "gyro", uiState.leftGyroView, axis),
              getSensorValue(latestRight, "gyro", uiState.rightGyroView, axis)
            )
          )}
        </tbody>
      </table>
    </div>
  );
}