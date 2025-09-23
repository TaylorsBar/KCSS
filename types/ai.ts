
import { AlertLevel } from './vehicle';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

// Types for the new Predictive AI Engine
export interface PredictiveIssue {
    component: string;
    rootCause: string;
    recommendedActions: string[];
    plainEnglishSummary: string;
    tsbs?: string[];
}

export interface TimelineEvent {
    id:string;
    level: AlertLevel;
    title: string;
    timeframe: string; // e.g., "Immediate", "Next 3 months", "Within 5000 miles"
    details: PredictiveIssue;
}
