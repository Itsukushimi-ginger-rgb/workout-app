// 負荷方式
export type LoadMode = 'external' | 'weighted' | 'assist';

// フェーズ
export type Phase = 'intro1' | 'intro2' | 'intro3' | 'intro4' | 'final';

// セットペアインデックス (0=1・2, 1=3・4, 2=5・6, 3=7・8)
export type PairIndex = 0 | 1 | 2 | 3;

// 判定結果
export type Verdict = 'achieved' | 'missed' | 'hold_rir' | 'hold_mismatch' | 'pending';

// セッションステータス
export type SessionStatus = 'active' | 'completed' | 'abandoned';

// トレーニング枠
export type TrainingBlock = 'chest_bicep' | 'legs' | 'shoulder_tricep' | 'back_abs';

export const TRAINING_BLOCKS: Record<TrainingBlock, { label: string; exerciseIds: string[] }> = {
  chest_bicep: { label: '胸＋二頭', exerciseIds: ['incline_bench', 'barbell_curl'] },
  legs: { label: '脚', exerciseIds: ['squat'] },
  shoulder_tricep: { label: '肩＋三頭', exerciseIds: ['db_shoulder_press', 'skull_crusher'] },
  back_abs: { label: '背中＋腹', exerciseIds: ['pullup', 'ab_roller'] },
};

// 種目設定
export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  loadMode: LoadMode;
  unit: string;
  delta: number;
  deltaAlt?: number; // バーベルカール用の2つ目のΔ
  set78Offset: 1 | 2; // セット7・8の開始時の軽さ（1Δ or 2Δ）
  initialLoad: number;
  isBodyweightOnly?: boolean; // 腹筋ローラー
}

// 種目進行状態
export interface ExerciseProgress {
  exerciseId: string;
  phase: Phase;
  loadPair12: number;
  loadPair34: number;
  loadPair56: number;
  loadPair78: number;
  loadDrop: number;
  failCountPair12: number;
  failCountPair34: number;
  failCountPair56: number;
  failCountPair78: number;
  dropUnlocked: boolean;
  lastPerformedAt?: string;
  isSetup: boolean; // 初回設定が完了しているか
}

// セッション
export interface WorkoutSession {
  id: string;
  startedAt: string;
  trainingBlock: TrainingBlock;
  exerciseIds: string[];
  skippedExerciseIds: string[];
  completedExerciseIds: string[];
  currentExerciseId?: string;
  status: SessionStatus;
}

// セット記録
export interface SetRecord {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number; // 1-8
  isDropSet: boolean;
  plannedLoad: number;
  actualLoad: number;
  plannedRepsRange: string; // "8〜12回目安"
  actualReps: number;
  plannedRir: number;
  actualRir: number;
  recordedAt: string;
}

// ワークアウト記録（種目完了後の判定結果）
export interface WorkoutRecord {
  id: string;
  sessionId: string;
  exerciseId: string;
  performedAt: string;
  phaseAtStart: Phase;
  setRecords: SetRecord[];
  verdictPair12: Verdict;
  verdictPair34: Verdict;
  verdictPair56: Verdict;
  verdictPair78: Verdict;
  verdictDrop: Verdict;
  nextPrescription: string; // JSON string
  note: string;
}

// 次回処方の型
export interface PrescriptionSet {
  setLabel: string; // "1・2"
  load: number;
  repsRange: string;
  targetRir: number;
  isNew?: boolean; // 今回新たに解放されたペア
}

export interface Prescription {
  exerciseId: string;
  phase: Phase;
  nextPhase: Phase;
  sets: PrescriptionSet[];
  summary: string; // 表示用テキスト
  verdictMessages: string[];
}

// ドロップセット設定（最終フェーズ移行時にユーザーが入力）
export interface DropSetConfig {
  exerciseId: string;
  dropLoad: number;
}
