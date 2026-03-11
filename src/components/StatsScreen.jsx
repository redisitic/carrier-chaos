import { useGame } from "../context/GameContext";
import { xpLevel } from "../game/logic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

export default function StatsScreen() {
  const { state } = useGame();
  const { completedDeliveries, stats, money, points, xp, totalShipments } = state;
  const { level, title } = xpLevel(xp);

  // Points per carrier bar chart
  const carrierMap = {};
  for (const d of completedDeliveries) {
    const name = d.deliveryResult?.carrierName || "Unknown";
    if (!carrierMap[name]) carrierMap[name] = { count: 0, points: 0 };
    carrierMap[name].count += 1;
    carrierMap[name].points += d.deliveryResult?.points || 0;
  }
  const carrierNames = Object.keys(carrierMap);
  const CARRIER_COLORS_ARR = ["#3b82f6", "#22c55e", "#f97316", "#06b6d4"];

  const barData = {
    labels: carrierNames.length ? carrierNames : ["No data"],
    datasets: [
      {
        label: "Deliveries",
        data: carrierNames.map((n) => carrierMap[n].count),
        backgroundColor: CARRIER_COLORS_ARR,
        borderRadius: 6,
      },
    ],
  };

  // Terrain breakdown doughnut
  const terrainMap = {};
  for (const d of completedDeliveries) {
    const t = d.destinationTerrain;
    terrainMap[t] = (terrainMap[t] || 0) + 1;
  }
  const terrainLabels = Object.keys(terrainMap);
  const TERRAIN_COLORS = ["#6366f1", "#f59e0b", "#06b6d4", "#f97316"];

  const doughnutData = {
    labels: terrainLabels.length ? terrainLabels : ["No data"],
    datasets: [
      {
        data: terrainLabels.length ? terrainLabels.map((t) => terrainMap[t]) : [1],
        backgroundColor: TERRAIN_COLORS,
        borderWidth: 2,
        borderColor: "#1e293b",
      },
    ],
  };

  const progress = Math.round((stats.totalDelivered / totalShipments) * 100);

  return (
    <div className="screen stats-screen">
      {/* Summary cards */}
      <div className="stats-cards">
        <StatCard label="Points" value={points} icon="🏆" accent="#f59e0b" />
        <StatCard label="Funds" value={`$${money}`} icon="💰" accent="#22c55e" />
        <StatCard label="XP" value={`${xp} (Lv.${level})`} icon="⭐" accent="#6366f1" />
        <StatCard label="Delivered" value={`${stats.totalDelivered} / ${totalShipments}`} icon="📦" accent="#3b82f6" />
        <StatCard label="Anomalies" value={stats.totalAnomalies} icon="⚠️" accent="#f97316" />
        <StatCard label="Fast Deliveries" value={stats.fastDeliveries} icon="⚡" accent="#06b6d4" />
      </div>

      {/* Progress bar */}
      <div className="panel">
        <div className="panel-header"><h3>Mission Progress</h3><span>{progress}%</span></div>
        <div className="big-progress-track">
          <div className="big-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-label">{stats.totalDelivered} of {totalShipments} shipments delivered — {title}</div>
      </div>

      {/* Charts */}
      <div className="charts-row h-20vh">
        <div className="panel chart-panel">
          <div className="panel-header"><h3>Deliveries by Carrier</h3></div>
          <Bar
            data={barData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: "#94a3b8" }, grid: { color: "#1e293b" } },
                y: { ticks: { color: "#94a3b8" }, grid: { color: "#1e293b" } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }) {
  return (
    <div className="stat-card" style={{ "--accent": accent }}>
      <span className="stat-card-icon">{icon}</span>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}
