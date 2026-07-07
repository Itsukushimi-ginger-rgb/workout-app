import type { Exercise, ExerciseProgress, Phase } from './types';

export const INITIAL_EXERCISES: Exercise[] = [
  {
    id: 'incline_bench',
    name: 'インクラインベンチプレス',
    bodyPart: '胸',
    loadMode: 'external',
    unit: 'kg',
    delta: 2.5,
    set78Offset: 1,
    initialLoad: 40,
  },
  {
    id: 'barbell_curl',
    name: 'バーベルカール',
    bodyPart: '二頭',
    loadMode: 'external',
    unit: 'kg',
    delta: 1.25,
    deltaAlt: 2.5,
    set78Offset: 1,
    initialLoad: 20,
  },
  {
    id: 'squat',
    name: 'スクワット',
    bodyPart: '脚',
    loadMode: 'external',
    unit: 'kg',
    delta: 2.5,
    set78Offset: 1,
    initialLoad: 60,
  },
  {
    id: 'db_shoulder_press',
    name: 'シーテッドダンベルショルダープレス',
    bodyPart: '肩',
    loadMode: 'external',
    unit: 'kg',
    delta: 2,
    set78Offset: 1,
    initialLoad: 16,
  },
  {
    id: 'skull_crusher',
    name: 'スカルクラッシャー',
    bodyPart: '三頭',
    loadMode: 'external',
    unit: 'kg',
    delta: 1.25,
    deltaAlt: 2.5,
    set78Offset: 1,
    initialLoad: 20,
  },
  {
    id: 'pullup',
    name: '懸垂',
    bodyPart: '背中',
    loadMode: 'assist', // デフォルトはアシスト
    unit: 'kg',
    delta: 5,
    set78Offset: 1,
    initialLoad: 20, // アシスト20kgからスタート
  },
  {
    id: 'ab_roller',
    name: '腹筋ローラー',
    bodyPart: '腹',
    loadMode: 'external',
    unit: '',
    delta: 0,
    set78Offset: 1,
    initialLoad: 0,
    isBodyweightOnly: true,
  },
];

export function createInitialProgress(exerciseId: string): ExerciseProgress {
  const phase: Phase = exerciseId === 'ab_roller' ? 'final' : 'intro1';
  return {
    exerciseId,
    phase,
    loadPair12: 0,
    loadPair34: 0,
    loadPair56: 0,
    loadPair78: 0,
    loadDrop: 0,
    failCountPair12: 0,
    failCountPair34: 0,
    failCountPair56: 0,
    failCountPair78: 0,
    dropUnlocked: exerciseId === 'ab_roller',
    isSetup: exerciseId === 'ab_roller',
  };
}

export async function seedDatabase(db: import('./db').WorkoutDB): Promise<void> {
  const existingExercises = await db.exercises.count();
  if (existingExercises > 0) return;

  await db.exercises.bulkAdd(INITIAL_EXERCISES);

  const progressRecords = INITIAL_EXERCISES.map((ex) => createInitialProgress(ex.id));
  await db.exerciseProgress.bulkAdd(progressRecords);
}
