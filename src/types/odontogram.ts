export interface Stroke {
  id: string;
  tool: 'pen' | 'eraser';
  strokeWidth: number;
  color: string;
  points: number[];
}

export interface OdontogramState {
  strokes: Stroke[];
  history: Stroke[][];
  historyStep: number;
}

export interface OdontogramSession {
  id?: string;
  patientId: string;
  doctorId: string;
  notes?: string;
  strokes: Stroke[];
  createdAt?: string;
}