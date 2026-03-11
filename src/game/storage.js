/**
 * Local storage leaderboard for CarrierChaos.
 * Stores top 10 high scores.
 */

const STORAGE_KEY = "carrierchaos_leaderboard";
const MAX_ENTRIES = 10;

export function getLeaderboard() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveScore(entry) {
    const board = getLeaderboard();
    board.push({
        ...entry,
        date: new Date().toISOString(),
    });

    // Sort by points descending, keep top N
    board.sort((a, b) => b.points - a.points);
    const trimmed = board.slice(0, MAX_ENTRIES);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
        // localStorage full or unavailable
    }

    return trimmed;
}

export function clearLeaderboard() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}

export function isHighScore(points) {
    const board = getLeaderboard();
    if (board.length < MAX_ENTRIES) return true;
    return points > board[board.length - 1].points;
}
