import type { Exercise, ExerciseProgress, Phase, Prescription, PrescriptionSet } from '../data/types';
import { getRepsRange } from './judge';
import { phaseLabel, getActiveSetsForPhase } from './progression';

// 各フェーズ・ペアに対するセットラベル
const PAIR_LABELS = ['1・2', '3・4', '5・6', '7・8'];

function buildSetsForPhase(
  phase: Phase,
  progress: ExerciseProgress,
  exercise: Exercise,
  prevPhase: Phase,
): PrescriptionSet[] {
  if (exercise.isBodyweightOnly) {
    return [{
      setLabel: '各セット',
      load: 0,
      repsRange: 'RIR0まで',
      targetRir: 0,
    }];
  }

  const totalSets = getActiveSetsForPhase(phase);
  const pairCount = totalSets / 2;
  const sets: PrescriptionSet[] = [];

  const loads = [
    progress.loadPair12,
    progress.loadPair34,
    progress.loadPair56,
    progress.loadPair78,
  ];

  for (let i = 0; i < pairCount; i++) {
    const isNew = phase !== prevPhase && i === pairCount - 1 && phase !== 'final';
    sets.push({
      setLabel: PAIR_LABELS[i],
      load: loads[i],
      repsRange: getRepsRange(i),
      targetRir: 0,
      isNew,
    });
  }

  // 最終フェーズはドロップセットも追加
  if (phase === 'final' && progress.dropUnlocked && progress.loadDrop > 0) {
    sets.push({
      setLabel: '8ドロップ',
      load: progress.loadDrop,
      repsRange: '5〜8回目安',
      targetRir: 0,
    });
  }

  return sets;
}

function buildVerdictMessages(
  progress: ExerciseProgress,
  prevProgress: ExerciseProgress,
  exercise: Exercise,
): string[] {
  const messages: string[] = [];

  // フェーズ変化の説明
  if (progress.phase !== prevProgress.phase) {
    if (progress.phase === 'final') {
      messages.push(`セット${PAIR_LABELS[3]}の二重ゴール未達が2回連続です。`);
      messages.push(`${prevProgress.loadPair78}${exercise.unit}を暫定固定しました。`);
      messages.push('次回からドロップセットを追加し、最終フェーズへ移行します。');
      messages.push('最終フェーズ移行時、ドロップ負荷を設定してください。');
    } else {
      const prevPairIndex = ['intro1','intro2','intro3','intro4'].indexOf(prevProgress.phase);
      if (prevPairIndex >= 0) {
        const pairLabel = PAIR_LABELS[prevPairIndex];
        const fixedLoad = [prevProgress.loadPair12, prevProgress.loadPair34, prevProgress.loadPair56, prevProgress.loadPair78][prevPairIndex];
        messages.push(`セット${pairLabel}の二重ゴール未達が2回連続です。`);
        messages.push(`${fixedLoad}${exercise.unit}を暫定固定しました。`);
        messages.push(`次回からセット${PAIR_LABELS[prevPairIndex + 1]}を追加します。`);
      }
    }
  }

  return messages;
}

export function buildPrescription(
  progress: ExerciseProgress,
  prevProgress: ExerciseProgress,
  exercise: Exercise,
): Prescription {
  const sets = buildSetsForPhase(progress.phase, progress, exercise, prevProgress.phase);
  const verdictMessages = buildVerdictMessages(progress, prevProgress, exercise);

  const setsDesc = exercise.isBodyweightOnly
    ? 'セット数無制限（2連続3回以下で終了）'
    : `${getActiveSetsForPhase(progress.phase)}セット${progress.phase === 'final' && progress.dropUnlocked ? '＋ドロップ' : ''}`;

  const summary = verdictMessages.length > 0
    ? verdictMessages.join('\n')
    : `次回：${phaseLabel(progress.phase)}・${setsDesc}`;

  return {
    exerciseId: exercise.id,
    phase: prevProgress.phase,
    nextPhase: progress.phase,
    sets,
    summary,
    verdictMessages,
  };
}

// 現在の進行状態から「今日の目標」を構築
export function buildTodayPlan(
  progress: ExerciseProgress,
  exercise: Exercise,
): PrescriptionSet[] {
  return buildSetsForPhase(progress.phase, progress, exercise, progress.phase);
}
