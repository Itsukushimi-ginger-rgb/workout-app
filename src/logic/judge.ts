import type { SetRecord, Verdict, Phase } from '../data/types';

interface DualGoal {
  firstMin: number;  // 前半セットの最小回数
  secondMin: number; // 後半セットの最小回数
}

// フェーズ・ペアインデックスから二重ゴール条件を取得
export function getDualGoal(phase: Phase, pairIndex: number): DualGoal {
  if (phase === 'final') {
    const goals: DualGoal[] = [
      { firstMin: 12, secondMin: 8 },  // 1・2
      { firstMin: 8, secondMin: 5 },   // 3・4
      { firstMin: 5, secondMin: 2 },   // 5・6
      { firstMin: 12, secondMin: 10 }, // 7・8
    ];
    return goals[pairIndex] ?? { firstMin: 12, secondMin: 8 };
  }
  // 導入フェーズ: pairIndexが今探索中のペア
  const introGoals: DualGoal[] = [
    { firstMin: 12, secondMin: 8 },  // 導入1: 1・2
    { firstMin: 8, secondMin: 5 },   // 導入2: 3・4
    { firstMin: 5, secondMin: 2 },   // 導入3: 5・6
    { firstMin: 12, secondMin: 10 }, // 導入4: 7・8
  ];
  return introGoals[pairIndex] ?? { firstMin: 12, secondMin: 8 };
}

// セットペアの回数目安文字列
export function getRepsRange(pairIndex: number): string {
  const ranges = ['8〜12回目安', '5〜8回目安', '2〜5回目安', '10〜12回目安'];
  return ranges[pairIndex] ?? '8〜12回目安';
}

// セットペアの目標RIR（腹筋ローラー以外は常に0）
export function getTargetRir(): number {
  return 0;
}

// セットペアの判定
export function evaluatePair(
  firstSet: SetRecord,
  secondSet: SetRecord,
  pairIndex: number,
  phase: Phase,
): Verdict {
  // 同一ペア内で重量が異なる場合
  if (!firstSet.isDropSet && !secondSet.isDropSet) {
    if (Math.abs(firstSet.actualLoad - secondSet.actualLoad) > 0.001) {
      return 'hold_mismatch';
    }
  }

  const goalRir = getTargetRir();

  // RIRが目標より大きい場合（例: 目標RIR0なのに実績RIR1）
  if (firstSet.actualRir > goalRir || secondSet.actualRir > goalRir) {
    return 'hold_rir';
  }

  const goal = getDualGoal(phase, pairIndex);
  const firstOk = firstSet.actualReps >= goal.firstMin;
  const secondOk = secondSet.actualReps >= goal.secondMin;

  return firstOk && secondOk ? 'achieved' : 'missed';
}

// ドロップセットの判定（メインセット8 + ドロップ）
export function evaluateDropPair(
  mainSet8: SetRecord,
  dropSet: SetRecord,
): Verdict {
  const goalRir = getTargetRir();
  if (mainSet8.actualRir > goalRir || dropSet.actualRir > goalRir) {
    return 'hold_rir';
  }
  // メインセット8で10回以上、ドロップで8回以上
  if (mainSet8.actualReps >= 10 && dropSet.actualReps >= 8) {
    return 'achieved';
  }
  return 'missed';
}

// 腹筋ローラーの終了判定
export function checkAbRollerEnd(recentReps: number[]): boolean {
  if (recentReps.length < 2) return false;
  const last2 = recentReps.slice(-2);
  return last2[0] <= 3 && last2[1] <= 3;
}
