import type { ExerciseProgress, Exercise, Phase, Verdict } from '../data/types';

function phaseToActivePairIndex(phase: Phase): number {
  switch (phase) {
    case 'intro1': return 0;
    case 'intro2': return 1;
    case 'intro3': return 2;
    case 'intro4': return 3;
    case 'final': return -1; // 全ペア独立
  }
}

function nextIntroPhase(phase: Phase): Phase {
  switch (phase) {
    case 'intro1': return 'intro2';
    case 'intro2': return 'intro3';
    case 'intro3': return 'intro4';
    case 'intro4': return 'final';
    default: return 'final';
  }
}

function getFailCount(progress: ExerciseProgress, pairIndex: number): number {
  switch (pairIndex) {
    case 0: return progress.failCountPair12;
    case 1: return progress.failCountPair34;
    case 2: return progress.failCountPair56;
    case 3: return progress.failCountPair78;
    default: return 0;
  }
}

function setFailCount(progress: ExerciseProgress, pairIndex: number, count: number): ExerciseProgress {
  switch (pairIndex) {
    case 0: return { ...progress, failCountPair12: count };
    case 1: return { ...progress, failCountPair34: count };
    case 2: return { ...progress, failCountPair56: count };
    case 3: return { ...progress, failCountPair78: count };
    default: return progress;
  }
}

function getPairLoad(progress: ExerciseProgress, pairIndex: number): number {
  switch (pairIndex) {
    case 0: return progress.loadPair12;
    case 1: return progress.loadPair34;
    case 2: return progress.loadPair56;
    case 3: return progress.loadPair78;
    default: return 0;
  }
}

function setPairLoad(progress: ExerciseProgress, pairIndex: number, load: number): ExerciseProgress {
  switch (pairIndex) {
    case 0: return { ...progress, loadPair12: load };
    case 1: return { ...progress, loadPair34: load };
    case 2: return { ...progress, loadPair56: load };
    case 3: return { ...progress, loadPair78: load };
    default: return progress;
  }
}

// 導入フェーズ: 探索中ペアの判定処理
function processIntroPair(
  progress: ExerciseProgress,
  exercise: Exercise,
  pairIndex: number,
  verdict: Verdict,
): ExerciseProgress {
  if (verdict === 'achieved') {
    // 負荷を1Δ難しくして続行
    const currentLoad = getPairLoad(progress, pairIndex);
    const newLoad = makeHarder(currentLoad, exercise);
    let next = setPairLoad(progress, pairIndex, newLoad);
    next = setFailCount(next, pairIndex, 0);
    return next;
  }

  if (verdict === 'missed') {
    const currentFail = getFailCount(progress, pairIndex);
    if (currentFail >= 1) {
      // 2回連続失敗 → 現在の負荷を固定して次フェーズへ
      let next = setFailCount(progress, pairIndex, 0);
      // 次のフェーズへ移行
      const nextPhase = nextIntroPhase(progress.phase);
      next = { ...next, phase: nextPhase };
      // 次ペアの初期負荷を設定
      if (nextPhase !== 'final') {
        const nextPairIndex = pairIndex + 1;
        // セット7・8は特殊: セット1・2の固定負荷よりoffset分軽い
        if (nextPairIndex === 3) {
          const load12 = progress.loadPair12;
          const offset = exercise.set78Offset ?? 1;
          const newLoad78 = makeEasier(load12, exercise, offset);
          next = setPairLoad(next, 3, newLoad78);
        } else {
          // セット3・4、5・6はひとつ前のペアより1Δ難しい
          const prevLoad = getPairLoad(progress, pairIndex);
          const newLoad = makeHarder(prevLoad, exercise);
          next = setPairLoad(next, nextPairIndex, newLoad);
        }
      } else {
        // 最終フェーズへ移行: ドロップセットはユーザーが後で設定
        next = { ...next, dropUnlocked: true };
      }
      return next;
    } else {
      // 1回目の失敗 → 同じ負荷で再試行
      return setFailCount(progress, pairIndex, currentFail + 1);
    }
  }

  // hold系は進行変更なし
  return progress;
}

// 最終フェーズ: 指定ペアの判定処理
function processFinalPair(
  progress: ExerciseProgress,
  exercise: Exercise,
  pairIndex: number,
  verdict: Verdict,
): ExerciseProgress {
  if (verdict === 'achieved') {
    const currentLoad = getPairLoad(progress, pairIndex);
    const newLoad = makeHarder(currentLoad, exercise);
    return setPairLoad(progress, pairIndex, newLoad);
  }
  return progress;
}

// ドロップセット判定の処理（最終フェーズ）
export function processDropVerdict(
  progress: ExerciseProgress,
  exercise: Exercise,
  verdict: Verdict,
): ExerciseProgress {
  if (verdict === 'achieved') {
    const newDrop = makeHarder(progress.loadDrop, exercise);
    return { ...progress, loadDrop: newDrop };
  }
  return progress;
}

// 判定を受けて次のExerciseProgressを返す
export function computeNextProgress(
  progress: ExerciseProgress,
  exercise: Exercise,
  pairIndex: number,
  verdict: Verdict,
): ExerciseProgress {
  if (progress.phase === 'final') {
    return processFinalPair(progress, exercise, pairIndex, verdict);
  }
  const activePair = phaseToActivePairIndex(progress.phase);
  if (pairIndex === activePair) {
    return processIntroPair(progress, exercise, pairIndex, verdict);
  }
  return progress;
}

// 負荷を1Δ難しくする
export function makeHarder(load: number, exercise: Exercise): number {
  if (exercise.loadMode === 'assist') {
    // アシスト懸垂: アシスト重量を減らす
    return Math.max(0, load - exercise.delta);
  }
  return load + exercise.delta;
}

// 負荷をnΔ簡単にする
export function makeEasier(load: number, exercise: Exercise, n: number = 1): number {
  if (exercise.loadMode === 'assist') {
    return load + exercise.delta * n;
  }
  return load - exercise.delta * n;
}

// 今日行うセット数（フェーズによる）
export function getActiveSetsForPhase(phase: Phase): number {
  switch (phase) {
    case 'intro1': return 2;
    case 'intro2': return 4;
    case 'intro3': return 6;
    case 'intro4': return 8;
    case 'final': return 8; // + ドロップ
  }
}

// フェーズ表示名
export function phaseLabel(phase: Phase): string {
  switch (phase) {
    case 'intro1': return '導入1';
    case 'intro2': return '導入2';
    case 'intro3': return '導入3';
    case 'intro4': return '導入4';
    case 'final': return '最終';
  }
}
