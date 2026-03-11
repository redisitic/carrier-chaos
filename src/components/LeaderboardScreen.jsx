import { useState, useEffect } from "react";
import { getLeaderboard, clearLeaderboard } from "../game/storage";

export default function LeaderboardScreen({ onClose }) {
    const [board, setBoard] = useState([]);

    useEffect(() => {
        setBoard(getLeaderboard());
    }, []);

    const handleClear = () => {
        if (confirm("Are you sure you want to clear the leaderboard?")) {
            clearLeaderboard();
            setBoard([]);
        }
    };

    return (
        <div className="screen leaderboard-screen" style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px"
        }}>
            <div className="panel" style={{ width: "100%", maxWidth: 600 }}>
                <div className="panel-header" style={{ display: "flex", justifyContent: "space-between" }}>
                    <h2>🏅 High Scores</h2>
                    <button className="nav-btn" onClick={onClose} style={{ padding: "4px 12px" }}>Close</button>
                </div>

                {board.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                        No scores recorded yet. Play a game!
                    </div>
                ) : (
                    <div className="leaderboard-table" style={{ margin: "20px 0" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                    <th style={{ padding: "8px", width: "40px" }}>#</th>
                                    <th style={{ padding: "8px" }}>Score</th>
                                    <th style={{ padding: "8px" }}>Delivered</th>
                                    <th style={{ padding: "8px" }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {board.map((entry, index) => (
                                    <tr key={index} style={{ borderBottom: "1px solid var(--border)", background: index === 0 ? "rgba(245, 158, 11, 0.1)" : "transparent" }}>
                                        <td style={{ padding: "8px", fontWeight: "bold" }}>{index + 1}</td>
                                        <td style={{ padding: "8px", color: "var(--success)" }}>{entry.points}</td>
                                        <td style={{ padding: "8px" }}>{entry.delivered}</td>
                                        <td style={{ padding: "8px", fontSize: "0.85em", color: "var(--text-muted)" }}>
                                            {new Date(entry.date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                    <button className="nav-btn" onClick={handleClear} style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
                        Clear Scores
                    </button>
                </div>
            </div>
        </div>
    );
}
