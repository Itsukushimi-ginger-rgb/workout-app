import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';

export function useExercises() {
  return useLiveQuery(() => db.exercises.toArray(), []);
}

export function useExercise(id: string) {
  return useLiveQuery(() => db.exercises.get(id), [id]);
}

export function useExerciseProgress(id: string) {
  return useLiveQuery(() => db.exerciseProgress.get(id), [id]);
}

export function useAllProgress() {
  return useLiveQuery(() => db.exerciseProgress.toArray(), []);
}
