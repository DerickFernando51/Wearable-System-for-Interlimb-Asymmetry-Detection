import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

type AsymmetryIndex = {
    accel_contribution?: number;
    gyro_contribution?: number;
    force_contribution?: number;
    comp_score?: number;
    overall_stronger?: string;
};

type ContributionPieChartProps = {
    asymmetryIndex: AsymmetryIndex | null;
};

const COLORS = ["#FA8C16", "#00C49F", "#FFBB28"];

export default function ContributionPieChart({ asymmetryIndex }: ContributionPieChartProps) {
    if (!asymmetryIndex) return <div>No data</div>;

    // Build pie data from contributions
    const pieData = [
        { name: "Accelerometer", value: asymmetryIndex.accel_contribution ?? 0 },
        { name: "Gyroscope", value: asymmetryIndex.gyro_contribution ?? 0 },
        { name: "Force", value: asymmetryIndex.force_contribution ?? 0 },
    ];



    return (
        <div>
            <div className="composite-score-container">
                <span className="composite-score">
                    <span className="composite-score-label">Composite Asymmetry Score:</span>
                    <span className="composite-score-value">
                        {typeof asymmetryIndex.comp_score === "number"
                            ? `${asymmetryIndex.comp_score.toFixed(1)}%`
                            : "-"}
                    </span>
                </span>
            </div>
            <div className="composite-score-container">
                <span className="composite-score">
                    <span className="composite-score-label">Stronger Limb:</span>
                    <span className="composite-score-foot">
                        {asymmetryIndex.overall_stronger ?? "—"}
                    </span></span>
            </div>

            <div className="piechart-container">
                <h3 className="piechart-title">Contribution Towards Composite Score:</h3>
                <div className="piechart">
                    <PieChart width={400} height={250}>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }: { name?: string; value?: number }) =>
                                value != null ? `${name}: ${value.toFixed(1)}%` : `${name}: 0%`
                            }
                        >
                            {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={15} />
                        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    </PieChart>
                </div>
            </div>
        </div>
    );
}