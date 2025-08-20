
export enum AppState {
  SETUP,
  DICTATION,
  RESULT,
}

export interface ComparisonResult {
  correctChar: string;
  userChar: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
  explanation?: string;
}

export interface AnalysisResult {
  score: number;
  comparison: ComparisonResult[];
}