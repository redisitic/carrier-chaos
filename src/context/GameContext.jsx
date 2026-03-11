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
  SCORE,
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

// ── Constants ──────────────────────────────────────────────────────────────────
const DAY_START_MINUTES = 9 * 60;   // 09:00
const DAY_END_MINUTES   = 17 * 60;  // 17:00

// ── Initial state ─────────────────────────────────────────────────────────────

function createInitialState() {
  return {
    // Clock — starts at 09:00
    gameMinutes: DAY_START_MINUTES,
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
    // Daily tracking
    dailyPoints: 0,
    dailyStats: {
      delivered: 0,
      failed: 0,
      expired: 0,
      costEfficient: 0,
    },
    pastDays: [],
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function addLog(log, message, type = "info") {
  return [{ message, type, time: Date.now() }, ...log].slice(0, 50);
}

/** Calculate money earned at end of day based on points scored (₹15 per point, min ₹0) */
function calcDailyEarnings(dailyPoints) {
  return Math.max(0, Math.round(dailyPoints * 15));
}

/** Run EOD logic: save stats, reset clock to 09:00 next day, preserve shipments */
function triggerEOD(state) {
  const dailyMoneyEarned = calcDailyEarnings(state.dailyPoints);
  const newPastDays = [
    ...state.pastDays,
    { day: state.day, points: state.dailyPoints, stats: state.dailyStats, moneyEarned: dailyMoneyEarned },
  ];
  let newLog = addLog(state.log, `🌇 Day ${state.day} complete — 5:00 PM. Review your EOD report!`, "info");
  if (dailyMoneyEarned > 0) {
    newLog = addLog(newLog, `💰 Day ${state.day} payout: ₹${dailyMoneyEarned.toLocaleString()} credited (${state.dailyPoints} pts × ₹15)`, "success");
  } else {
    newLog = addLog(newLog, `📉 No payout today — points must be positive to earn end-of-day revenue.`, "warning");
  }
  return {
    ...state,
    money: state.money + dailyMoneyEarned,
    pastDays: newPastDays,
    dailyPoints: 0,
    dailyStats: { delivered: 0, failed: 0, expired: 0, costEfficient: 0 },
    screen: "daily_summary",
    running: false,
    // Clock: advance to next day at 09:00 — preserved on START_NEXT_DAY
    gameMinutes: DAY_START_MINUTES,
    day: state.day + 1,
    log: newLog,
  };
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

      // ── EOD check — 17:00 boundary ──
      if (newMinutes >= DAY_END_MINUTES) {
        // Run normal delivery / queue processing with the CURRENT minutes first
        // so nothing is lost right at end-of-day
        newMinutes = DAY_END_MINUTES; // cap at 17:00 for clean display
        return triggerEOD({ ...state, gameMinutes: newMinutes });
      }

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
      let newDailyStats = { ...state.dailyStats };
      let newDailyPoints = state.dailyPoints;
      let newOrders = [...state.orders];
      let newScreen = state.screen;
      let newRunning = state.running;

      const gameHour = newMinutes / 60;

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

        const updatedEvents = d.trackingTimeline.map((evt) => ({
          ...evt,
          triggered: elapsedHours >= evt.offsetHours,
        }));

        if (elapsedHours >= d.deliveryResult.durationHours) {
          if (d.deliveryResult.deliverySuccess) {
            const finished = { ...d, status: "delivered", trackingTimeline: updatedEvents };
            newCompleted.push(finished);
            newStats.totalDelivered += 1;
            newDailyStats.delivered += 1;
            if (d.deliveryResult.slaMatch) newStats.onTimeDeliveries += 1;
            if (d.deliveryResult.costEfficient) {
              newStats.costEfficient += 1;
              newDailyStats.costEfficient += 1;
            }
            newPoints += d.deliveryResult.points;
            newDailyPoints += d.deliveryResult.points;
            newXp += d.deliveryResult.xpGain;
            synth.play("delivered");
            newLog = addLog(newLog, `✅ Order #${d.id} delivered via ${d.deliveryResult.carrierName} ${d.deliveryResult.serviceName}`, "success");
          } else {
            const failed = { ...d, status: "failed", trackingTimeline: updatedEvents };
            failed.trackingTimeline.push({ code: "EXCEPTION", offsetHours: d.deliveryResult.durationHours, triggered: true });
            newFailed.push(failed);
            newStats.totalFailed += 1;
            newDailyStats.failed += 1;
            newStats.totalAnomalies += 1;
            newPoints += d.deliveryResult.points;
            newDailyPoints += d.deliveryResult.points;
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
          newDailyStats.expired += 1;
          newPoints += SCORE.expiredOrder;        // point penalty
          newDailyPoints += SCORE.expiredOrder;
          newLog = addLog(newLog, `⏰ Order #${order.id} expired! −${Math.abs(SCORE.expiredOrder)} pts penalty.`, "error");
          newOrders = newOrders.map((o) => o.id === order.id ? { ...o, status: "expired" } : o);
        } else {
          freshQueue.push(order);
        }
      }
      newQueue = freshQueue;

      // ── Generate new orders ──
      // Orders only arrive when warehouse is open AND before 16:30 (30-min cutoff window before EOD)
      // Day 1 spawns at half rate to avoid overwhelming a fresh player
      const ORDER_CUTOFF_MINUTES = 16 * 60 + 30; // 16:30
      const warehouseOpen = isWarehouseOpen(gameHour) && newMinutes < ORDER_CUTOFF_MINUTES;
      const spawnChance = state.day === 1 ? 0.1 : 0.2;
      if (
        warehouseOpen &&
        newQueue.length < WAREHOUSE.capacity &&
        Math.random() < spawnChance
      ) {
        const newOrder = generateOrder(newMinutes);
        newOrders = [...newOrders, newOrder];
        newQueue = [...newQueue, { ...newOrder }];
        newLog = addLog(newLog, `📥 New order #${newOrder.id} from ${newOrder.storeIcon} ${newOrder.store} → ${newOrder.zone}`, "info");
      }

      // ── Check lose conditions (only out-of-funds) ──
      let newPhase = state.phase;
      if (newMoney < LOSE_CONDITIONS.minFunds) {
        newPhase = "lost";
        newLog = addLog(newLog, "💸 Out of funds! Game over.", "error");
        synth.play("gameover");
      }

      // ── Check win condition ──
      const allOrdersGenerated = newOrders.length >= state.totalShipments;
      const allProcessed = allOrdersGenerated && newActive.length === 0 && newQueue.length === 0;
      const enoughDelivered = newCompleted.length >= state.totalShipments * 0.6;
      if (allProcessed && enoughDelivered && newPhase === "playing") {
        newPhase = "won";
        newLog = addLog(newLog, "🎉 All shipments processed! Great job, logistics pro!", "success");
        synth.play("win");
      }

      return {
        ...state,
        gameMinutes: newMinutes,
        orders: newOrders,
        warehouseQueue: newQueue,
        activeDeliveries: newActive,
        completedDeliveries: newCompleted,
        failedDeliveries: newFailed,
        expiredOrders: newExpired,
        money: newMoney,
        points: newPoints,
        dailyPoints: newDailyPoints,
        xp: newXp,
        log: newLog,
        stats: newStats,
        dailyStats: newDailyStats,
        pastDays: state.pastDays,
        weather: newWeather,
        lastWeatherChange: newLastWeatherChange,
        phase: newPhase,
        running: newPhase === "playing" ? newRunning : false,
        screen: newPhase !== "playing" ? "gameover" : newScreen,
      };
    }

    case "START_NEXT_DAY": {
      // gameMinutes + day already advanced by triggerEOD; just resume
      return {
        ...state,
        screen: "warehouse",
        running: true,
      };
    }

    // ── Debug panel actions ────────────────────────────────────────────────
    case "ADJUST_TIME": {
      const delta = action.deltaMinutes || 0;
      const clamped = Math.min(DAY_END_MINUTES - 1, Math.max(DAY_START_MINUTES, state.gameMinutes + delta));
      return { ...state, gameMinutes: clamped };
    }

    case "END_DAY_NOW": {
      if (state.phase !== "playing") return state;
      return triggerEOD({ ...state, gameMinutes: DAY_END_MINUTES });
    }

    case "RESTART_DAY": {
      // Reset clock and daily counters; preserve all shipments / cumulative stats
      return {
        ...state,
        gameMinutes: DAY_START_MINUTES,
        dailyPoints: 0,
        dailyStats: { delivered: 0, failed: 0, expired: 0, costEfficient: 0 },
        running: true,
        log: addLog(state.log, `🔄 Day ${state.day} restarted — clock reset to 09:00.`, "info"),
      };
    }

    // ── Standard actions ───────────────────────────────────────────────────
    case "SELECT_ORDER": {
      return { ...state, selectedOrderId: action.orderId, screen: "carrier" };
    }

    case "DISPATCH_ORDER": {
      const { orderId, carrierName, serviceName, filterBonus = 0 } = action;
      const order = state.warehouseQueue.find((o) => o.id === orderId);
      if (!order) return state;

      const result = calculateDelivery(order, carrierName, serviceName, state.gameMinutes, state.weather);
      if (state.money < result.cost) {
        return {
          ...state,
          log: addLog(state.log, "💸 Not enough funds to dispatch this order!", "error"),
        };
      }

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

      let newLog = addLog(
        state.log,
        `🏷️ Dispatched #${orderId} via ${carrierName} — ${serviceName} (₹${result.cost}, ${result.sla})`,
        "info"
      );

      let bonusPoints = 0;
      let bonusDailyPoints = 0;
      if (filterBonus > 0) {
        bonusPoints = filterBonus;
        bonusDailyPoints = filterBonus;
        newLog = addLog(newLog, `📌 Smart Dispatch +${filterBonus} pts (${filterBonus / 2} filter${filterBonus / 2 > 1 ? "s" : ""} × 2)`, "success");
      }

      const newOrders = state.orders.map((o) =>
        o.id === orderId ? { ...o, status: "in_transit", selectedCarrier: carrierName, selectedService: serviceName, deliveryResult: result } : o
      );

      return {
        ...state,
        money: state.money - result.cost,
        points: state.points + bonusPoints,
        dailyPoints: state.dailyPoints + bonusDailyPoints,
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
