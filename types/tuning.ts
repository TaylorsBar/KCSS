
// For AI Tuning Suggestions from FastAPI
export interface AiTuningSuggestion {
  title: string;
  rationale: string;
  changes: {
    key: 'rpmLimit' | 'boostTarget' | 'afrTarget' | string;
    from: number;
    to: number;
  }[];
  risk: 'low' | 'medium' | 'high';
}

// For Comprehensive Tuning Suite
export interface TuningMap {
  id: 've' | 'ignition' | 'afr';
  name: string;
  xAxis: { label: string; values: number[]; unit: string };
  yAxis: { label: string; values: number[]; unit: string };
  data: number[][];
  unit: string;
}


// For Pre-write Check response
export interface PrewriteCheckResponse {
  ok: boolean;
  reason: string | null;
  audit: {
    hash: string;
    payload: string;
  };
}
