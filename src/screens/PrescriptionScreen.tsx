import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import type { SetRecord, Verdict } from '../data/types';
import { evaluatePair, evaluateDropPair } from '../logic/judge';
import { computeNextProgress, processDropVerdict, phaseLabel } from '../logic/progression';
import { buildPrescription } from '../logic/prescription';
import { completeExercise } from '../hooks/useSession';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { nanoid } from '../utils/nanoid';

function verdictLabel(v: Verdict): { text: string; color: string } {
  switch (v) {
    case 'achieved': return { text: '二重ゴール達成！', color: 'text-green-600' };
    case 'missed': return { text: '二重ゴール未達', color: 'text-orange-500' };
    case 'hold_rir': return { text: '判定保留：目標RIRに達していません', color: 'text-red-500' };
    case 'hold_mismatch': return { text: '判定保留：同一ペア内で使用重量が異なります', color: 'text-red-500' };
    case 'pending': return { text: '未実施', color: 'text-gray-400' };
  }
}

const PAIR_LABELS = ['1・2', '3・4', '5・6', '7・8'];

export function PrescriptionScreen() {
  const { sessionId, exerciseId } = useParams<{ sessionId: string; exerciseId: string }>();
  const navigate = useNavigate();

  const exercise = useLiveQuery(() => exerciseId ? db.exercises.get(exerciseId) : undefined, [exerciseId]);
  const progress = useLiveQuery(() => exerciseId ? db.exerciseProgress.get(exerciseId) : undefined, [exerciseId]);
  const session = useLiveQuery(() => sessionId ? db.sessions.get(sessionId) : undefined, [sessionId]);
  const setRecords = useLiveQuery<SetRecord[]>(
    () => sessionId && exerciseId
      ? db.setRecords.where('sessionId').equals(sessionId).filter(r => r.exerciseId === exerciseId).sortBy('setNumber')
      : Promise.resolve([] as SetRecord[]),
    [sessionId, exerciseId],
  );

  const [dropLoad, setDropLoad] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  if (!exercise || !progress || !session || !setRecords) {
    return <div className="flex items-center justify-center min-h-screen"><p>計算中...</p></div>;
  }

  function getPairSets(pairIndex: number): [SetRecord | undefined, SetRecord | undefined] {
    const first = pairIndex * 2 + 1;
    const second = pairIndex * 2 + 2;
    return [
      setRecords?.find(r => r.setNumber === first),
      setRecords?.find(r => r.setNumber === second),
    ];
  }

  const verdicts: Verdict[] = ['pending', 'pending', 'pending', 'pending'];
  const maxPairs = Math.ceil((setRecords.length) / 2);

  for (let i = 0; i < maxPairs; i++) {
    const [s1, s2] = getPairSets(i);
    if (s1 && s2) {
      verdicts[i] = evaluatePair(s1, s2, i, progress.phase);
    }
  }

  const mainSet8 = setRecords.find(r => r.setNumber === 8 && !r.isDropSet);
  const dropSet = setRecords.find(r => r.isDropSet);
  const dropVerdict: Verdict = (mainSet8 && dropSet)
    ? evaluateDropPair(mainSet8, dropSet)
    : 'pending';

  let nextProgress = { ...progress };

  if (!exercise.isBodyweightOnly) {
    if (progress.phase === 'final') {
      for (let i = 0; i < 4; i++) {
        if (verdicts[i] !== 'pending') {
          nextProgress = computeNextProgress(nextProgress, exercise, i, verdicts[i]);
        }
      }
      if (dropVerdict !== 'pending') {
        nextProgress = processDropVerdict(nextProgress, exercise, dropVerdict);
      }
    } else {
      const activePairIndex = ['intro1','intro2','intro3','intro4'].indexOf(progress.phase);
      if (activePairIndex >= 0 && verdicts[activePairIndex] !== 'pending') {
        nextProgress = computeNextProgress(nextProgress, exercise, activePairIndex, verdicts[activePairIndex]);
      }
    }
  }

  const needsDropSetup = nextProgress.phase === 'final' && progress.phase !== 'final' && nextProgress.loadDrop === 0;

  const prescription = buildPrescription(nextProgress, progress, exercise);

  async function handleConfirm() {
    if (!exercise || !progress || !session) return;
    setSaving(true);
    try {
      let finalProgress = { ...nextProgress };

      if (needsDropSetup && dropLoad !== '') {
        finalProgress = { ...finalProgress, loadDrop: Number(dropLoad) };
      }

      finalProgress.lastPerformedAt = new Date().toISOString();

      await db.exerciseProgress.put(finalProgress);

      const record = {
        id: nanoid(),
        sessionId: session.id,
        exerciseId: exercise.id,
        performedAt: new Date().toISOString(),
        phaseAtStart: progress.phase,
        setRecords: setRecords ?? [],
        verdictPair12: verdicts[0],
        verdictPair34: verdicts[1],
        verdictPair56: verdicts[2],
        verdictPair78: verdicts[3],
        verdictDrop: dropVerdict,
        nextPrescription: JSON.stringify(prescription),
        note: '',
      };
      await db.workoutRecords.add(record);

      await completeExercise(session.id, exercise.id);

      navigate(`/session/${session.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white px-4 py-4">
        <h1 className="text-xl font-bold">{exercise.name}</h1>
        <p className="text-sm text-white/80">次回の処方</p>
      </header>

      <main className="flex-1 px-4 py-4 flex flex-col gap-4">
        <Card>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">今日の実績</h3>
          {exercise.isBodyweightOnly ? (
            <p className="text-sm text-gray-700">{setRecords.length}セット実施</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {setRecords.map((r) => (
                <div key={r.id} className="bg-gray-100 rounded-lg px-3 py-2 text-center min-w-[56px]">
                  <div className="text-xs text-gray-500">S{r.setNumber}{r.isDropSet ? '(D)' : ''}</div>
                  <div className="text-sm font-bold">{r.actualLoad}{exercise.unit}</div>
                  <div className="text-xs text-gray-600">{r.actualReps}回 RIR{r.actualRir}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {!exercise.isBodyweightOnly && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">判定</h3>
            <div className="flex flex-col gap-2">
              {verdicts.map((v, i) => {
                if (v === 'pending' && (i * 2 + 1) > setRecords.length) return null;
                const { text, color } = verdictLabel(v);
                return (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">セット{PAIR_LABELS[i]}</span>
                    <span className={`text-sm font-medium ${color}`}>{text}</span>
                  </div>
                );
              })}
              {dropVerdict !== 'pending' && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ドロップ</span>
                  <span className={`text-sm font-medium ${verdictLabel(dropVerdict).color}`}>
                    {verdictLabel(dropVerdict).text}
                  </span>
                </div>
              )}
            </div>

            {verdicts.some(v => v === 'hold_rir' || v === 'hold_mismatch') && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-700">
                  判定保留の場合、次回は同じ設定を再試行してください。
                </p>
              </div>
            )}
          </Card>
        )}

        {prescription.verdictMessages.length > 0 && (
          <Card className="bg-blue-50">
            {prescription.verdictMessages.map((msg, i) => (
              <p key={i} className="text-sm text-blue-800 mb-1 last:mb-0">{msg}</p>
            ))}
          </Card>
        )}

        {needsDropSetup && (
          <Card className="border-2 border-orange-300">
            <h3 className="text-sm font-semibold text-orange-700 mb-2">最終フェーズ移行：ドロップ負荷を設定</h3>
            <p className="text-xs text-gray-500 mb-3">
              セット8のメイン負荷より軽く、5〜8回を狙えそうな重量を入力してください。
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={dropLoad}
                onChange={e => setDropLoad(e.target.value === '' ? '' : parseFloat(e.target.value))}
                inputMode="decimal"
                placeholder="例: 35"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-3 text-lg text-right focus:outline-none focus:border-blue-500"
              />
              <span className="text-sm text-gray-500">{exercise.unit}</span>
            </div>
          </Card>
        )}

        <Card>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            次回の処方：{phaseLabel(nextProgress.phase)}
          </h3>
          {exercise.isBodyweightOnly ? (
            <p className="text-sm text-gray-700">セット数無制限（2連続3回以下で終了）・RIR0</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b">
                  <th className="text-left py-1">セット</th>
                  <th className="text-right py-1">負荷</th>
                  <th className="text-right py-1">回数目安</th>
                  <th className="text-right py-1">RIR</th>
                </tr>
              </thead>
              <tbody>
                {prescription.sets.map((s, i) => (
                  <tr key={i} className={['border-b border-gray-100', s.isNew ? 'bg-green-50' : ''].join(' ')}>
                    <td className="py-2 text-left">
                      {s.setLabel}
                      {s.isNew && <span className="ml-1 text-xs text-green-600 font-bold">NEW</span>}
                    </td>
                    <td className="py-2 text-right font-semibold">
                      {s.load > 0 ? `${s.load}${exercise.unit}` : '—'}
                    </td>
                    <td className="py-2 text-right text-xs text-gray-500">{s.repsRange}</td>
                    <td className="py-2 text-right text-xs text-gray-500">RIR{s.targetRir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Button
          fullWidth
          size="lg"
          onClick={handleConfirm}
          disabled={saving || (needsDropSetup && dropLoad === '')}
        >
          {saving ? '保存中...' : '記録を保存して次へ'}
        </Button>
      </main>
    </div>
  );
}
