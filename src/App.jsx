import { Suspense, lazy, useEffect } from "react";
import { GameProvider, useGame } from "./context/GameContext";
import HUD from "./components/HUD";
import StartScreen from "./components/StartScreen";
import WarehouseScreen from "./components/WarehouseScreen";
import CarrierSelectionScreen from "./components/CarrierSelectionScreen";
import TrackingScreen from "./components/TrackingScreen";
import StatsScreen from "./components/StatsScreen";
import GameOverScreen from "./components/GameOverScreen";
import DailySummaryScreen from "./components/DailySummaryScreen";
import CarriersPage from "./components/CarriersPage";
import PortraitOverlay from "./components/PortraitOverlay";
const MapboxMap = lazy(() => import("./components/Map3D/MapboxMap"));
import "./App.css";

function GameRouter() {
  const { state, dispatch } = useGame();
  const { screen, phase, running, orders, toast } = state;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => dispatch({ type: "SET_TOAST", toast: null }), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Not started yet
  if (orders.length === 0 && !running && phase === "playing") {
    return <StartScreen />;
  }

  if (phase !== "playing" || screen === "gameover") {
    return (
      <div className="game-layout">
        <HUD />
        <main className="game-main">
          <GameOverScreen />
        </main>
      </div>
    );
  }

  return (
    <div className="game-layout">
      <HUD />
      {toast && <div className="determination-toast">{toast}</div>}
      <main className="game-main">
        {screen === "warehouse" && <WarehouseScreen />}
        {screen === "carrier" && <CarrierSelectionScreen />}
        {screen === "tracking" && <TrackingScreen />}
        {screen === "stats" && <StatsScreen />}
        {screen === "daily_summary" && <DailySummaryScreen />}
        {screen === "carriers" && <CarriersPage />}
        {screen === "map" && (
          <Suspense fallback={<div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading Map...</div>}>
            <div className="screen-map">
              <MapboxMap />
            </div>
          </Suspense>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <PortraitOverlay />
      <GameRouter />
    </GameProvider>
  );
}
