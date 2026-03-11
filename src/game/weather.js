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
 * Get the delivery time multiplier for current weather + terrain.
 * Fog only affects Waterway, Wind only affects Mountain.
 */
export function getWeatherMultiplier(weather, terrain) {
    if (!weather) return 1.0;

    // If weather has a terrain-specific effect, only apply full multiplier to that terrain
    if (weather.terrainEffect) {
        if (terrain === weather.terrainEffect) {
            return weather.deliveryMultiplier;
        }
        // Partial effect on other terrains
        return 1.0 + (weather.deliveryMultiplier - 1.0) * 0.3;
    }

    return weather.deliveryMultiplier;
}

/**
 * Check if weather should change at this game minute.
 */
export function shouldWeatherChange(gameMinutes) {
    return gameMinutes > 0 && gameMinutes % WEATHER_CHANGE_INTERVAL === 0;
}
