import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from "react";
import {
  INITIAL_PLAYER,
  WAREHOUSE,
  TICK_INTERVAL_MS,
  MINUTES_PER_TICK,
  LOSE_CONDITIONS,
  SPEED_OPTIONS,
  WEATHER_TYPES,
  WEATHER_CHANGE_INTERVAL,
} from "../game/constants";
import {
  generateOrder,
  calculateDelivery,
  isWarehouseOpen,
  resetOrderId,
  getCarrierCost,
} from "../game/logic";
import { getNextWeather } from "../game/weather";
import { synth } from "../hooks/useAudio";

// ── Initial state ─────────────────────────────────────────────────────────────

function createInitialState() {
  return {
    // Clock
    gameMinutes: 8 * 60 + 45,
    day: 1,
    running: false,
    screen: "warehouse",
    phase: "playing",

    // Speed control
    speedIndex: 0, // index into SPEED_OPTIONS

    // Weather
    weather: WEATHER_TYPES[0], // start clear
    lastWeatherChange: 0,

    // Player resources
    money: INITIAL_PLAYER.money,
    totalShipments: INITIAL_PLAYER.totalShipments,
    xp: INITIAL_PLAYER.xp,
    points: INITIAL_PLAYER.points,

    // Orders
    orders: [],
    warehouseQueue: [],
    activeDeliveries: [],
    completedDeliveries: [],
    failedDeliveries: [],

    // UI state
    selectedOrderId: null,
    log: [],
    stats: {
      totalDelivered: 0,
      totalFailed: 0,
      totalAnomalies: 0,
      fastDeliveries: 0,
      correctCarrierChoices: 0,
    },
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case "START_GAME": {
      const fresh = createInitialState();
      resetOrderId();
      return { ...fresh, running: true };
    }

    case "TICK": {
      if (!state.running || state.phase !== "playing") return state;

      let newMinutes = state.gameMinutes + MINUTES_PER_TICK;
      let newDay = state.day;
      if (newMinutes >= 24 * 60) {
        newMinutes -= 24 * 60;
        newDay += 1;
      }

      const gameHour = newMinutes / 60;
      let newQueue = [...state.warehouseQueue];
      let newActive = [...state.activeDeliveries];
      let newCompleted = [...state.completedDeliveries];
      let newFailed = [...state.failedDeliveries];
      let newMoney = state.money;
      let newPoints = state.points;
      let newXp = state.xp;
      let newLog = [...state.log];
      let newStats = { ...state.stats };
      let newOrders = [...state.orders];

      let newWeather = state.weather;
      let newLastWeatherChange = state.lastWeatherChange;

      // Weather checks
      const nextChangeCheck = newLastWeatherChange + WEATHER_CHANGE_INTERVAL;
      if (newMinutes >= nextChangeCheck) {
        newWeather = getNextWeather(state.weather.type);
        newLastWeatherChange = newMinutes;
        if (newWeather.type !== state.weather.type) {
          newLog = addLog(newLog, `Weather changed to ${newWeather.label} ${newWeather.icon}`, "info");
        }
      }

      // Advance in-transit timers
      const stillInTransit = [];
      for (const d of newActive) {
        const remainingHours = d.remainingHours - MINUTES_PER_TICK / 60;
        if (remainingHours <= 0) {
          // Delivery complete
          const finished = { ...d, remainingHours: 0, status: "delivered" };
          newCompleted.push(finished);
          newStats.totalDelivered += 1;
          if (d.deliveryResult.isFast) newStats.fastDeliveries += 1;
          if (d.deliveryResult.terrainMatch) newStats.correctCarrierChoices += 1;
          if (d.deliveryResult.anomaly) {
            newStats.totalAnomalies += 1;
            synth.play("anomaly");
          } else {
            synth.play("delivered");
          }
          newLog = addLog(newLog, `Delivered order #${d.id} via ${d.deliveryResult.carrierName}`, "success");
          // Update order status
          newOrders = newOrders.map((o) => o.id === d.id ? { ...o, status: "delivered" } : o);
        } else {
          stillInTransit.push({ ...d, remainingHours });
        }
      }
      newActive = stillInTransit;

      // Randomly generate new orders during warehouse hours
      const warehouseOpen = isWarehouseOpen(gameHour);
      const remainingToGenerate = state.totalShipments - newOrders.length;
      if (
        warehouseOpen &&
        remainingToGenerate > 0 &&
        newQueue.length < WAREHOUSE.capacity &&
        Math.random() < 0.25 // ~25% chance per tick to generate an order
      ) {
        const newOrder = generateOrder(Math.floor(gameHour));
        newOrders = [...newOrders, newOrder];
        newQueue = [...newQueue, { ...newOrder }];
        newLog = addLog(newLog, `New order #${newOrder.id} arrived (${newOrder.destinationTerrain}, ${newOrder.distance}km)`, "info");
      }

      // Check lose conditions
      let newPhase = state.phase;
      if (newMoney < LOSE_CONDITIONS.minFunds) {
        newPhase = "lost";
        newLog = addLog(newLog, "Out of funds! Game over.", "error");
        synth.play("gameover");
      }
      if (newFailed.length > LOSE_CONDITIONS.maxFailedShipments) {
        newPhase = "lost";
        newLog = addLog(newLog, "Too many failed shipments! Game over.", "error");
        synth.play("gameover");
      }

      // Check win condition: all generated orders delivered
      const allOrdersGenerated = newOrders.length >= state.totalShipments;
      const allDelivered = allOrdersGenerated && newActive.length === 0 && newQueue.length === 0 && newCompleted.length >= state.totalShipments;
      if (allDelivered && newPhase === "playing") {
        newPhase = "won";
        newLog = addLog(newLog, "All shipments delivered! You win!", "success");
        synth.play("win");
      }

      return {
        ...state,
        gameMinutes: newMinutes,
        day: newDay,
        orders: newOrders,
        warehouseQueue: newQueue,
        activeDeliveries: newActive,
        completedDeliveries: newCompleted,
        failedDeliveries: newFailed,
        money: newMoney,
        points: newPoints,
        xp: newXp,
        log: newLog,
        stats: newStats,
        weather: newWeather,
        lastWeatherChange: newLastWeatherChange,
        phase: newPhase,
        running: newPhase === "playing",
        screen: newPhase !== "playing" ? "gameover" : state.screen,
      };
    }

    case "SELECT_ORDER": {
      return { ...state, selectedOrderId: action.orderId, screen: "carrier" };
    }

    case "DISPATCH_ORDER": {
      const { orderId, carrierName } = action;
      const order = state.warehouseQueue.find((o) => o.id === orderId);
      if (!order) return state;

      const gameHour = state.gameMinutes / 60;
      const result = calculateDelivery(order, carrierName, gameHour, state.weather);
      if (state.money < result.cost) {
        return {
          ...state,
          log: addLog(state.log, "Not enough funds to dispatch this order!", "error"),
        };
      }

      const dispatched = {
        ...order,
        status: "in_transit",
        selectedCarrier: carrierName,
        deliveryResult: result,
        remainingHours: result.durationHours,
      };

      synth.play("dispatch");

      const newLog = addLog(
        state.log,
        result.anomaly
          ? `Dispatched #${orderId} via ${carrierName} — ANOMALY: ${result.anomaly.label}!`
          : `Dispatched #${orderId} via ${carrierName} (ETA: ${result.durationHours.toFixed(1)}h)`,
        result.anomaly ? "warning" : "info"
      );

      const newOrders = state.orders.map((o) =>
        o.id === orderId ? { ...o, status: "in_transit", selectedCarrier: carrierName, deliveryResult: result } : o
      );

      return {
        ...state,
        money: state.money - result.cost,
        points: state.points + result.points,
        xp: state.xp + result.xpGain,
        warehouseQueue: state.warehouseQueue.filter((o) => o.id !== orderId),
        activeDeliveries: [...state.activeDeliveries, dispatched],
        orders: newOrders,
        log: newLog,
        selectedOrderId: null,
        screen: "warehouse",
      };
    }

    case "SET_SCREEN":
      return { ...state, screen: action.screen };

    case "TOGGLE_PAUSE":
      return { ...state, running: !state.running };

    case "SET_SPEED": {
      const idx = action.speedIndex;
      if (idx >= 0 && idx < SPEED_OPTIONS.length) {
        return { ...state, speedIndex: idx };
      }
      return state;
    }

    default:
      return state;
  }
}

function addLog(log, message, type = "info") {
  const entry = { id: Date.now() + Math.random(), message, type, ts: Date.now() };
  return [entry, ...log].slice(0, 50); // keep last 50 entries
}

// ── Context ───────────────────────────────────────────────────────────────────

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);
  const tickRef = useRef(null);

  const tick = useCallback(() => dispatch({ type: "TICK" }), []);

  useEffect(() => {
    if (state.running) {
      const speed = SPEED_OPTIONS[state.speedIndex] || SPEED_OPTIONS[0];
      tickRef.current = setInterval(tick, speed.interval);
    } else {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [state.running, state.speedIndex, tick]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
