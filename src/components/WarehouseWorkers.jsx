import { useMemo } from "react";
import { useGame } from "../context/GameContext";

const WORKER_EMOJIS = ["👷", "👷‍♀️", "🧑‍🏭", "👷‍♂️", "🧑‍🔧"];

/**
 * Animated warehouse workers panel.
 * Shows workers carrying boxes, with animation states
 * based on how many orders are being processed.
 */
export default function WarehouseWorkers({ totalWorkers = 5, busyCount = 0 }) {
    const workers = useMemo(() => {
        return Array.from({ length: totalWorkers }, (_, i) => ({
            id: i,
            emoji: WORKER_EMOJIS[i % WORKER_EMOJIS.length],
            busy: i < busyCount,
        }));
    }, [totalWorkers, busyCount]);

    return (
        <div className="workers-panel">
            <div className="workers-label">
                <span>Workers</span>
                <span className="workers-count">{busyCount}/{totalWorkers} active</span>
            </div>
            <div className="workers-row">
                {workers.map((w) => (
                    <div
                        key={w.id}
                        className={`worker-sprite ${w.busy ? "worker-busy" : "worker-idle"}`}
                        style={{ animationDelay: `${w.id * 0.15}s` }}
                    >
                        <span className="worker-emoji">{w.emoji}</span>
                        {w.busy && (
                            <span className="worker-box" style={{ animationDelay: `${w.id * 0.2}s` }}>
                                📦
                            </span>
                        )}
                        {!w.busy && (
                            <span className="worker-status">💤</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
