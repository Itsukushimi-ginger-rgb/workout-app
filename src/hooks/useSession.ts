import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { TRAINING_BLOCKS } from '../data/types';
import type { TrainingBlock, WorkoutSession } from '../data/types';
import { nanoid } from '../utils/nanoid';

export function useActiveSession() {
  return useLiveQuery(
    () => db.sessions.where('status').equals('active').first(),
    [],
  );
}

export async function startSession(block: TrainingBlock): Promise<WorkoutSession> {
  // 既存のactiveセッションがあれば破棄
  await db.sessions.where('status').equals('active').modify({ status: 'abandoned' });

  const exerciseIds = TRAINING_BLOCKS[block].exerciseIds;
  const session: WorkoutSession = {
    id: nanoid(),
    startedAt: new Date().toISOString(),
    trainingBlock: block,
    exerciseIds,
    skippedExerciseIds: [],
    completedExerciseIds: [],
    currentExerciseId: exerciseIds[0],
    status: 'active',
  };
  await db.sessions.add(session);
  return session;
}

export async function skipExercise(sessionId: string, exerciseId: string) {
  const session = await db.sessions.get(sessionId);
  if (!session) return;

  const skipped = [...session.skippedExerciseIds, exerciseId];
  const remaining = session.exerciseIds.filter(
    (id) => !skipped.includes(id) && !session.completedExerciseIds.includes(id),
  );
  const nextExercise = remaining.find((id) => id !== exerciseId) ?? remaining[0];

  await db.sessions.update(sessionId, {
    skippedExerciseIds: skipped,
    currentExerciseId: nextExercise,
  });
}

export async function completeExercise(sessionId: string, exerciseId: string) {
  const session = await db.sessions.get(sessionId);
  if (!session) return;

  const completed = [...session.completedExerciseIds, exerciseId];
  const remaining = session.exerciseIds.filter(
    (id) => !session.skippedExerciseIds.includes(id) && !completed.includes(id),
  );
  const nextExercise = remaining[0];

  await db.sessions.update(sessionId, {
    completedExerciseIds: completed,
    currentExerciseId: nextExercise,
    status: remaining.length === 0 ? 'completed' : 'active',
  });
}

export async function saveSetRecord(record: import('../data/types').SetRecord) {
  await db.setRecords.put(record);
}

export async function getSessionSets(sessionId: string, exerciseId: string) {
  return db.setRecords
    .where('sessionId').equals(sessionId)
    .and((r) => r.exerciseId === exerciseId)
    .sortBy('setNumber');
}
