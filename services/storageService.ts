
import { SavedRaceSession, Leaderboard } from '../types';

const SESSIONS_KEY = 'cartelworx_race_sessions';
const LEADERBOARD_KEY = 'cartelworx_leaderboard';

export const getSavedSessions = (): SavedRaceSession[] => {
    try {
        const data = localStorage.getItem(SESSIONS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to load saved sessions:", error);
        return [];
    }
};

export const saveSession = (session: SavedRaceSession): void => {
    try {
        const sessions = getSavedSessions();
        sessions.unshift(session); // Add to the beginning
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 50))); // Limit to 50 sessions
    } catch (error) {
        console.error("Failed to save session:", error);
    }
};

export const getLeaderboard = (): Leaderboard => {
    try {
        const data = localStorage.getItem(LEADERBOARD_KEY);
        const defaults: Leaderboard = { zeroToHundred: null, quarterMileTime: null, quarterMileSpeed: null };
        return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    } catch (error) {
        console.error("Failed to load leaderboard:", error);
        return { zeroToHundred: null, quarterMileTime: null, quarterMileSpeed: null };
    }
};

export const updateLeaderboard = (session: SavedRaceSession): void => {
    try {
        const board = getLeaderboard();
        const date = new Date().toISOString();

        if (session.zeroToHundredTime) {
            if (!board.zeroToHundred || session.zeroToHundredTime < board.zeroToHundred.value) {
                board.zeroToHundred = { value: session.zeroToHundredTime, date };
            }
        }
        if (session.quarterMileTime) {
            if (!board.quarterMileTime || session.quarterMileTime < board.quarterMileTime.value) {
                board.quarterMileTime = { value: session.quarterMileTime, date };
            }
        }
        if (session.quarterMileSpeed) {
            if (!board.quarterMileSpeed || session.quarterMileSpeed > board.quarterMileSpeed.value) {
                board.quarterMileSpeed = { value: session.quarterMileSpeed, date };
            }
        }
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
    } catch (error) {
        console.error("Failed to update leaderboard:", error);
    }
};
