import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  XAxis,
  YAxis,
  Line,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import { incidentColor } from "./reportMeta";



const countLabel = (value) =>
  `${value} reporte${value === 1 ? "" : "s"}`;

const AXIS_COLOR = "#9ca3af";
const GRID_COLOR = "#333333";
const LABEL_COLOR = "#e5e7eb";

const axisProps = {
  stroke: AXIS_COLOR,
  tick: { fill: AXIS_COLOR, fontSize: 12 },
};

const tooltipProps = {
  contentStyle: {
    backgroundColor: "#242424",
    border: "1px solid #3f3f3f",
    borderRadius: "8px",
    color: "#e5e7eb",
    fontSize: "12px",
  },
  itemStyle: { color: "#e5e7eb" },
  labelStyle: { color: "#9ca3af" },
};

const ReportsChart = ({ incidentData, monthData }) => {
  const total = incidentData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div style={styles.wrapper}>
      <div style={styles.twoColumns}>
        <div style={styles.card}>
          <h2 style={styles.title}>Reportes por tipo de incidente</h2>
          <div style={styles.chartBox}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={incidentData}
                layout="vertical"
                margin={{ top: 8, right: 32, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke={GRID_COLOR}
                />
                <XAxis type="number" allowDecimals={false} {...axisProps} />
                <YAxis
                  type="category"
                  dataKey="incident"
                  width={90}
                  {...axisProps}
                />
                <Tooltip
                  formatter={(value) => [countLabel(value), "Cantidad"]}
                  cursor={{ fill: "rgba(255,255,255,0.06)" }}
                  {...tooltipProps}
                />
                <Bar dataKey="count" barSize={22} radius={[0, 4, 4, 0]}>
                  {incidentData.map(({ incident }) => (
                    <Cell
                      key={incident}
                      fill={incidentColor(incident)}
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth={1}
                    />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="right"
                    fill={LABEL_COLOR}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/*<div style={styles.card}>
          <h2 style={styles.title}>Distribución por tipo de incidente</h2>
          <div style={styles.chartBoxPie}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value) => [
                    `${countLabel(value)} (${Math.round(
                      (value / total) * 100
                    )}%)`,
                    "Cantidad",
                  ]}
                  {...tooltipProps}
                />
                <Pie
                  data={incidentData}
                  dataKey="count"
                  nameKey="incident"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  paddingAngle={2}
                  stroke="#1e1e1e"
                  strokeWidth={1}
                >
                  {incidentData.map(({ incident }) => (
                    <Cell key={incident} fill={incidentColor(incident)} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value) => (
                    <span style={{ color: LABEL_COLOR }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>*/}
      </div>

      {monthData.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.title}>Reportes por mes</h2>
          <div style={styles.chartBoxSmall}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthData}
                margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={GRID_COLOR}
                />
                <XAxis
                  dataKey="label"
                  minTickGap={16}
                  interval="preserveStartEnd"
                  {...axisProps}
                />
                <YAxis
                  allowDecimals={false}
                  width={32}
                  {...axisProps}
                />
                <Tooltip
                  formatter={(value) => [countLabel(value), "Cantidad"]}
                  cursor={{
                    stroke: "rgba(255,255,255,0.25)",
                    strokeWidth: 1,
                  }}
                  {...tooltipProps}
                />
                <Line
                  //type="monotone"
                  dataKey="count"
                  name="Reportes"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: "#3b82f6",
                    stroke: "#1e1e1e",
                    strokeWidth: 1,
                  }}
                  activeDot={{ r: 5, stroke: "#1e1e1e", strokeWidth: 1 }}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                    fill={LABEL_COLOR}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },
  card: {
    backgroundColor: "#1e1e1e",
    border: "1px solid rgba(255, 255, 255, 0.22)",
    borderRadius: "10px",
    padding: "16px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
  },
  title: {
    margin: "0 0 12px",
    fontSize: "15px",
    color: "#f3f4f6",
  },
  chartBox: {
    width: "100%",
    height: "340px",
  },
  chartBoxPie: {
    width: "100%",
    height: "340px",
  },
  chartBoxSmall: {
    width: "100%",
    height: "280px",
  },
};

export default ReportsChart;
