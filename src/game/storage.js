import { collection, query, orderBy, limit, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "leaderboard";
const MAX_ENTRIES = 10;

export async function getLeaderboard() {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy("points", "desc"), limit(MAX_ENTRIES));
        const querySnapshot = await getDocs(q);
        const board = [];
        querySnapshot.forEach((doc) => {
            board.push({ id: doc.id, ...doc.data() });
        });
        return board;
    } catch (e) {
        console.error("Error fetching leaderboard:", e);
        return [];
    }
}

export async function saveScore(entry) {
    try {
        await addDoc(collection(db, COLLECTION_NAME), {
            ...entry,
            date: new Date().toISOString()
        });
        return await getLeaderboard();
    } catch (e) {
        console.error("Error saving score:", e);
        return [];
    }
}

export async function clearLeaderboard() {
    console.warn("clearLeaderboard is not supported with Firestore directly from client.");
}

export async function isHighScore(points) {
    const board = await getLeaderboard();
    if (board.length < MAX_ENTRIES) return true;
    return points > board[board.length - 1].points;
}
