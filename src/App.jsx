import { GameProvider, useGame } from "./context/GameContext";
import HUD from "./components/HUD";
import StartScreen from "./components/StartScreen";
import WarehouseScreen from "./components/WarehouseScreen";
import CarrierSelectionScreen from "./components/CarrierSelectionScreen";
import TrackingScreen from "./components/TrackingScreen";
import StatsScreen from "./components/StatsScreen";
import GameOverScreen from "./components/GameOverScreen";
import "./App.css";

function GameRouter() {
  const { state } = useGame();
  const { screen, phase, running, orders } = state;

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
      <main className="game-main">
        {screen === "warehouse" && <WarehouseScreen />}
        {screen === "carrier" && <CarrierSelectionScreen />}
        {screen === "tracking" && <TrackingScreen />}
        {screen === "stats" && <StatsScreen />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
