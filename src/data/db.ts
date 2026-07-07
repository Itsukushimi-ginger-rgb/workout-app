import Dexie, { type EntityTable } from 'dexie';
import type {
  Exercise,
  ExerciseProgress,
  WorkoutSession,
  SetRecord,
  WorkoutRecord,
} from './types';

export class WorkoutDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  exerciseProgress!: EntityTable<ExerciseProgress, 'exerciseId'>;
  sessions!: EntityTable<WorkoutSession, 'id'>;
  setRecords!: EntityTable<SetRecord, 'id'>;
  workoutRecords!: EntityTable<WorkoutRecord, 'id'>;

  constructor() {
    super('WorkoutDB');
    this.version(1).stores({
      exercises: 'id, name, bodyPart',
      exerciseProgress: 'exerciseId, phase, lastPerformedAt',
      sessions: 'id, startedAt, trainingBlock, status',
      setRecords: 'id, sessionId, exerciseId, setNumber, recordedAt',
      workoutRecords: 'id, sessionId, exerciseId, performedAt',
    });
  }
}

export const db = new WorkoutDB();
