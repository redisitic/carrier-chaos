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
  TRACKING_EVENTS,
} from "../game/constants";
import {
  generateOrder,
  calculateDelivery,
  isWarehouseOpen,
  resetOrderId,
  isOrderExpired,
  generateTrackingTimeline,
} from "../game/logic";
import { getNextWeather } from "../game/weather";
import { synth } from "../hooks/useAudio";

// ── Initial state ─────────────────────────────────────────────────────────────

function createInitialState() {
  return {
    // Clock
    gameMinutes: 7 * 60 + 50,  // Start at 07:50, warehouse opens at 08:00
    day: 1,
    running: false,
    screen: "warehouse",
    phase: "playing",

    // Speed control
    speedIndex: 0,

    // Weather
    weather: WEATHER_TYPES[0],
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
    expiredOrders: [],

    // UI state
    selectedOrderId: null,
    log: [],
    stats: {
      totalDelivered: 0,
      totalFailed: 0,
      totalExpired: 0,
      totalAnomalies: 0,
      onTimeDeliveries: 0,
      costEfficient: 0,
    },
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function addLog(log, message, type = "info") {
  return [{ message, type, time: Date.now() }, ...log].slice(0, 50);
}

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
      let newExpired = [...state.expiredOrders];
      let newMoney = state.money;
      let newPoints = state.points;
      let newXp = state.xp;
      let newLog = [...state.log];
      let newStats = { ...state.stats };
      let newOrders = [...state.orders];

      // ── Weather ──
      let newWeather = state.weather;
      let newLastWeatherChange = state.lastWeatherChange;
      const nextChangeCheck = newLastWeatherChange + WEATHER_CHANGE_INTERVAL;
      if (newMinutes >= nextChangeCheck) {
        newWeather = getNextWeather(state.weather.type);
        newLastWeatherChange = newMinutes;
        if (newWeather.type !== state.weather.type) {
          newLog = addLog(newLog, `⚠️ ${newWeather.label} ${newWeather.icon} — logistics may be affected`, "warning");
        }
      }

      // ── Advance in-transit deliveries ──
      const stillInTransit = [];
      for (const d of newActive) {
        const elapsedHours = (newMinutes - d.dispatchMinutes) / 60;

        // Update tracking events
        const updatedEvents = d.trackingTimeline.map((evt) => ({
          ...evt,
          triggered: elapsedHours >= evt.offsetHours,
        }));

        if (elapsedHours >= d.deliveryResult.durationHours) {
          // Delivery complete
          if (d.deliveryResult.deliverySuccess) {
            const finished = { ...d, status: "delivered", trackingTimeline: updatedEvents };
            newCompleted.push(finished);
            newStats.totalDelivered += 1;
            if (d.deliveryResult.slaMatch) newStats.onTimeDeliveries += 1;
            if (d.deliveryResult.costEfficient) newStats.costEfficient += 1;
            newPoints += d.deliveryResult.points;
            newXp += d.deliveryResult.xpGain;
            synth.play("delivered");
            newLog = addLog(newLog, `✅ Order #${d.id} delivered via ${d.deliveryResult.carrierName} ${d.deliveryResult.serviceName}`, "success");
          } else {
            // Reliability failure
            const failed = { ...d, status: "failed", trackingTimeline: updatedEvents };
            // Add exception event
            failed.trackingTimeline.push({ code: "EXCEPTION", offsetHours: d.deliveryResult.durationHours, triggered: true });
            newFailed.push(failed);
            newStats.totalFailed += 1;
            newStats.totalAnomalies += 1;
            synth.play("anomaly");
            newLog = addLog(newLog, `⚠️ Order #${d.id} FAILED — ${d.deliveryResult.carrierName} delivery exception`, "error");
          }
          newOrders = newOrders.map((o) => o.id === d.id ? { ...o, status: d.deliveryResult.deliverySuccess ? "delivered" : "failed" } : o);
        } else {
          stillInTransit.push({ ...d, trackingTimeline: updatedEvents });
        }
      }
      newActive = stillInTransit;

      // ── Check order expiry ──
      const freshQueue = [];
      for (const order of newQueue) {
        if (isOrderExpired(order, newMinutes)) {
          newExpired.push({ ...order, status: "expired" });
          newStats.totalExpired += 1;
          newStats.totalFailed += 1;
          newLog = addLog(newLog, `⏰ Order #${order.id} expired! Not assigned in time.`, "error");
          newOrders = newOrders.map((o) => o.id === order.id ? { ...o, status: "expired" } : o);
        } else {
          freshQueue.push(order);
        }
      }
      newQueue = freshQueue;

      // ── Generate new orders ──
      const warehouseOpen = isWarehouseOpen(gameHour);
      const remainingToGenerate = state.totalShipments - newOrders.length;
      if (
        warehouseOpen &&
        remainingToGenerate > 0 &&
        newQueue.length < WAREHOUSE.capacity &&
        Math.random() < 0.2
      ) {
        const newOrder = generateOrder(newMinutes);
        newOrders = [...newOrders, newOrder];
        newQueue = [...newQueue, { ...newOrder }];
        newLog = addLog(newLog, `📥 New order #${newOrder.id} from ${newOrder.storeIcon} ${newOrder.store} → ${newOrder.zone}`, "info");
      }

      // ── Check lose conditions ──
      let newPhase = state.phase;
      const totalFails = newFailed.length + newExpired.length;
      if (newMoney < LOSE_CONDITIONS.minFunds) {
        newPhase = "lost";
        newLog = addLog(newLog, "💸 Out of funds! Game over.", "error");
        synth.play("gameover");
      }
      if (totalFails > LOSE_CONDITIONS.maxFailedShipments) {
        newPhase = "lost";
        newLog = addLog(newLog, "❌ Too many failed/expired shipments! Game over.", "error");
        synth.play("gameover");
      }

      // ── Check win condition ──
      const allOrdersGenerated = newOrders.length >= state.totalShipments;
      const allProcessed = allOrdersGenerated && newActive.length === 0 && newQueue.length === 0;
      const enoughDelivered = newCompleted.length >= state.totalShipments * 0.6; // 60% must be delivered to win
      if (allProcessed && enoughDelivered && newPhase === "playing") {
        newPhase = "won";
        newLog = addLog(newLog, "🎉 All shipments processed! Great job, logistics pro!", "success");
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
        expiredOrders: newExpired,
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
      const { orderId, carrierName, serviceName } = action;
      const order = state.warehouseQueue.find((o) => o.id === orderId);
      if (!order) return state;

      const result = calculateDelivery(order, carrierName, serviceName, state.gameMinutes, state.weather);
      if (state.money < result.cost) {
        return {
          ...state,
          log: addLog(state.log, "💸 Not enough funds to dispatch this order!", "error"),
        };
      }

      // Generate tracking timeline
      const timeline = generateTrackingTimeline(result.sla, order.zone, result.durationHours);
      const trackingTimeline = timeline.map((evt) => ({
        ...evt,
        triggered: false,
      }));

      const dispatched = {
        ...order,
        status: "in_transit",
        selectedCarrier: carrierName,
        selectedService: serviceName,
        deliveryResult: result,
        dispatchMinutes: state.gameMinutes,
        trackingTimeline,
      };

      synth.play("dispatch");

      const newLog = addLog(
        state.log,
        `🏷️ Dispatched #${orderId} via ${carrierName} — ${serviceName} (₹${result.cost}, ${result.sla})`,
        "info"
      );

      const newOrders = state.orders.map((o) =>
        o.id === orderId ? { ...o, status: "in_transit", selectedCarrier: carrierName, selectedService: serviceName, deliveryResult: result } : o
      );

      return {
        ...state,
        money: state.money - result.cost,
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

    case "RESTART": {
      const fresh = createInitialState();
      resetOrderId();
      return { ...fresh, running: true };
    }

    default:
      return state;
  }
}

// ── Context + Provider ────────────────────────────────────────────────────────

const GameContext = createContext();

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);
  const intervalRef = useRef(null);

  const tick = useCallback(() => {
    dispatch({ type: "TICK" });
  }, []);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (state.running) {
      const speed = SPEED_OPTIONS[state.speedIndex] || SPEED_OPTIONS[0];
      intervalRef.current = setInterval(tick, speed.interval);
    }
    return () => clearInterval(intervalRef.current);
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
