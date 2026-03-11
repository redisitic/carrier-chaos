import {
  TERRAINS,
  TERRAIN_PENALTY,
  CARRIERS,
  ANOMALIES,
  SCORE,
  WAREHOUSE,
  RUSH_HOURS,
  RUSH_MULTIPLIER,
} from "./constants";
import { getWeatherMultiplier } from "./weather";

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Returns a random integer between min and max (inclusive). */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random element from an array. */
export function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Order generation ──────────────────────────────────────────────────────────

let _orderId = 100;

export function generateOrder(gameHour) {
  const terrain = randFrom(TERRAINS);
  const distance = randInt(50, 300);
  const priorities = ["Normal", "Express", "Economy"];
  const priority = randFrom(priorities);

  return {
    id: ++_orderId,
    destinationTerrain: terrain,
    distance,
    priority,
    arrivalTime: gameHour,
    status: "queued", // queued | processing | dispatched | delivered | failed
    selectedCarrier: null,
    deliveryResult: null,
  };
}

export function resetOrderId() {
  _orderId = 100;
}

// ── Dynamic pricing ──────────────────────────────────────────────────────────

/** Returns true if the given hour falls within a rush period. */
export function isRushHour(gameHour) {
  return RUSH_HOURS.some((rh) => gameHour >= rh.start && gameHour < rh.end);
}

/** Get dynamic cost for a carrier at the given game hour. */
export function getCarrierCost(carrier, gameHour) {
  const base = carrier.costPerShipment;
  if (isRushHour(gameHour)) {
    return Math.round(base * RUSH_MULTIPLIER);
  }
  return base;
}

/** Get cost trend: "up" during rush, "down" just after rush, "stable" otherwise. */
export function getCostTrend(gameHour) {
  if (isRushHour(gameHour)) return "up";
  // Just after rush (within 1 hour)
  if (RUSH_HOURS.some((rh) => gameHour >= rh.end && gameHour < rh.end + 1)) return "down";
  return "stable";
}

// ── Delivery calculation ──────────────────────────────────────────────────────

/**
 * Returns delivery result object:
 * { durationHours, anomaly, points, xpGain, cost, isLate, wrongTerrain }
 */
export function calculateDelivery(order, carrierName, gameHour = 12, weather = null) {
  const carrier = CARRIERS.find((c) => c.name === carrierName);
  const basePenalty = TERRAIN_PENALTY[order.destinationTerrain];
  const terrainMatch = carrier.preferredTerrains.includes(order.destinationTerrain);
  const penalty = terrainMatch ? basePenalty * 0.6 : basePenalty;

  let durationHours = (order.distance / carrier.speed) * penalty;

  // Apply weather multiplier
  if (weather) {
    const weatherMult = getWeatherMultiplier(weather, order.destinationTerrain);
    durationHours *= weatherMult;
  }

  // Anomaly check
  let anomaly = null;
  for (const a of ANOMALIES) {
    if (Math.random() < a.probability) {
      anomaly = { ...a };
      durationHours += a.extraHours;
      break;
    }
  }

  // Fast delivery threshold: under 2 hours
  const isFast = durationHours < 2;
  // Late: over 6 hours
  const isLate = durationHours > 6;
  const wrongTerrain = !terrainMatch;

  // Points
  let points = SCORE.successfulDelivery;
  if (isFast) points += SCORE.fastDelivery;
  if (!wrongTerrain) points += SCORE.correctCarrier;
  if (isLate) points += SCORE.lateDelivery;
  if (wrongTerrain) points += SCORE.wrongTerrainCarrier;

  const xpGain = Math.max(1, Math.floor(points / 10));
  // Use dynamic pricing
  const cost = getCarrierCost(carrier, gameHour);


  return {
    carrierName,
    durationHours: parseFloat(durationHours.toFixed(2)),
    anomaly,
    points,
    xpGain,
    cost,
    isLate,
    isFast,
    wrongTerrain,
    terrainMatch,
  };
}

// ── Carrier availability ──────────────────────────────────────────────────────

/** Returns true if carrier is available at given game hour (0–23). */
export function isCarrierAvailable(carrier, gameHour) {
  if (!carrier.operatingHours) return true; // 24h carrier
  return gameHour >= carrier.operatingHours.start && gameHour < carrier.operatingHours.end;
}

// ── Warehouse logic ───────────────────────────────────────────────────────────

/** Returns true if the warehouse is open at the given game hour. */
export function isWarehouseOpen(gameHour) {
  return gameHour >= WAREHOUSE.openHour && gameHour < WAREHOUSE.closeHour;
}

/** How many shipments can be processed simultaneously. */
export function maxConcurrentProcessing() {
  return WAREHOUSE.workers;
}

// ── XP level label ────────────────────────────────────────────────────────────

export function xpLevel(xp) {
  if (xp < 50) return { level: 1, title: "Rookie" };
  if (xp < 150) return { level: 2, title: "Handler" };
  if (xp < 300) return { level: 3, title: "Dispatcher" };
  if (xp < 500) return { level: 4, title: "Logistics Pro" };
  return { level: 5, title: "Supply Chain Master" };
}
