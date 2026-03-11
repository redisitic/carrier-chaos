import {
    WEATHER_TYPES,
    WEATHER_TRANSITIONS,
    WEATHER_CHANGE_INTERVAL,
} from "./constants";

/**
 * Pick next weather based on transition probabilities from current weather.
 */
export function getNextWeather(currentType) {
    const transitions = WEATHER_TRANSITIONS[currentType] || WEATHER_TRANSITIONS.clear;
    const roll = Math.random();
    let cumulative = 0;

    for (const [weatherType, prob] of Object.entries(transitions)) {
        cumulative += prob;
        if (roll <= cumulative) {
            return WEATHER_TYPES.find((w) => w.type === weatherType) || WEATHER_TYPES[0];
        }
    }

    return WEATHER_TYPES[0]; // fallback to clear
}

/**
 * Get the delivery time multiplier for current weather + destination zone.
 * Terrain-specific effects now apply to zones (e.g., "India Rural" for monsoon).
 */
export function getWeatherMultiplier(weather, zone) {
    if (!weather) return 1.0;

    // If weather has a zone-specific effect, apply full multiplier to that zone
    if (weather.terrainEffect) {
        if (zone === weather.terrainEffect) {
            return weather.deliveryMultiplier;
        }
        // Partial effect on other zones
        return 1.0 + (weather.deliveryMultiplier - 1.0) * 0.25;
    }

    return weather.deliveryMultiplier;
}

/**
 * Check if weather should change at this game minute.
 */
export function shouldWeatherChange(gameMinutes, lastWeatherChange) {
    return (gameMinutes - lastWeatherChange) >= WEATHER_CHANGE_INTERVAL;
}
