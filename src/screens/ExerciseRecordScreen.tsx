import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import type { SetRecord } from '../data/types';
import { getActiveSetsForPhase, phaseLabel } from '../logic/progression';
import { getRepsRange } from '../logic/judge';
import { checkAbRollerEnd } from '../logic/judge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { nanoid } from '../utils/nanoid';
import { saveSetRecord } from '../hooks/useSession';

function getPairLoad(progress: { loadPair12: number; loadPair34: number; loadPair56: number; loadPair78: number }, setNum: number): number {
  if (setNum <= 2) return progress.loadPair12;
  if (setNum <= 4) return progress.loadPair34;
  if (setNum <= 6) return progress.loadPair56;
  return progress.loadPair78;
}

function getPairIndexForSet(setNum: number): number {
  if (setNum <= 2) return 0;
  if (setNum <= 4) return 1;
  if (setNum <= 6) return 2;
  return 3;
}

function getRirOptions(): number[] {
  return [0, 1, 2, 3];
}

export function ExerciseRecordScreen() {
  const { sessionId, exerciseId } = useParams<{ sessionId: string; exerciseId: string }>();
  const navigate = useNavigate();

  const exercise = useLiveQuery(() => exerciseId ? db.exercises.get(exerciseId) : undefined, [exerciseId]);
  const progress = useLiveQuery(() => exerciseId ? db.exerciseProgress.get(exerciseId) : undefined, [exerciseId]);
  const session = useLiveQuery(() => sessionId ? db.sessions.get(sessionId) : undefined, [sessionId]);

  const existingSetRecords = useLiveQuery<SetRecord[]>(
    () => sessionId && exerciseId
      ? db.setRecords.where('sessionId').equals(sessionId).filter(r => r.exerciseId === exerciseId).sortBy('setNumber')
      : Promise.resolve([] as SetRecord[]),
    [sessionId, exerciseId],
  );

  const [currentSetNum, setCurrentSetNum] = useState(1);
  const [inputLoad, setInputLoad] = useState<number | ''>('');
  const [inputReps, setInputReps] = useState<number | ''>('');
  const [inputRir, setInputRir] = useState<number>(0);
  const [abRollerReps, setAbRollerReps] = useState<number[]>([]);
  const [abRollerCurrentReps, setAbRollerCurrentReps] = useState<number | ''>('');
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!progress || !exercise) return;
    if (exercise.isBodyweightOnly) return;

    const totalSets = getActiveSetsForPhase(progress.phase);
    const nextSet = (existingSetRecords?.length ?? 0) + 1;
    const setNum = Math.min(nextSet, totalSets);
    setCurrentSetNum(setNum);

    const plannedLoad = getPairLoad(progress, setNum);
    setInputLoad(plannedLoad);
    setInputRir(0);
    setInputReps('');
  }, [progress, exercise, existingSetRecords?.length]);

  if (!exercise || !progress || !session) {
    return <div className="flex items-center justify-center min-h-screen"><p>読み込み中...</p></div>;
  }

  const totalSets = exercise.isBodyweightOnly ? 999 : getActiveSetsForPhase(progress.phase);
  const completedSets = existingSetRecords?.length ?? 0;
  const isLastSet = !exercise.isBodyweightOnly && currentSetNum >= totalSets;

  const abRollerEnded = exercise.isBodyweightOnly && checkAbRollerEnd(abRollerReps);

  async function handleSaveSet() {
    if (!exercise || !progress || !session) return;
    if (inputLoad === '' || inputReps === '') return;

    const setNum = currentSetNum;
    const pairIdx = getPairIndexForSet(setNum);
    const plannedLoad = getPairLoad(progress, setNum);

    const record: SetRecord = {
      id: nanoid(),
      sessionId: session.id,
      exerciseId: exercise.id,
      setNumber: setNum,
      isDropSet: false,
      plannedLoad,
      actualLoad: Number(inputLoad),
      plannedRepsRange: getRepsRange(pairIdx),
      actualReps: Number(inputReps),
      plannedRir: 0,
      actualRir: inputRir,
      recordedAt: new Date().toISOString(),
    };

    await saveSetRecord(record);

    if (isLastSet) {
      navigate(`/session/${sessionId}/exercise/${exerciseId}/result`);
    } else {
      const nextSetNum = setNum + 1;
      setCurrentSetNum(nextSetNum);
      const nextLoad = getPairLoad(progress, nextSetNum);
      setInputLoad(nextLoad);
      setInputReps('');
      setInputRir(0);
    }
  }

  async function handleAbRollerAddSet() {
    if (abRollerCurrentReps === '') return;
    const reps = Number(abRollerCurrentReps);
    const newReps = [...abRollerReps, reps];
    setAbRollerReps(newReps);

    const record: SetRecord = {
      id: nanoid(),
      sessionId: session!.id,
      exerciseId: exercise!.id,
      setNumber: newReps.length,
      isDropSet: false,
      plannedLoad: 0,
      actualLoad: 0,
      plannedRepsRange: 'RIR0まで',
      actualReps: reps,
      plannedRir: 0,
      actualRir: 0,
      recordedAt: new Date().toISOString(),
    };
    await saveSetRecord(record);
    setAbRollerCurrentReps('');

    if (checkAbRollerEnd(newReps)) {
      setFinished(true);
    }
  }

  async function handleFinish() {
    navigate(`/session/${sessionId}/exercise/${exerciseId}/result`);
  }

  if (exercise.isBodyweightOnly) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-blue-600 text-white px-4 py-4">
          <button className="text-white/80 text-sm mb-1" onClick={() => navigate(`/session/${sessionId}`)}>← 一覧</button>
          <h1 className="text-xl font-bold">{exercise.name}</h1>
          <p className="text-sm text-white/80">{phaseLabel(progress.phase)}・RIR0まで</p>
        </header>

        <main className="flex-1 px-4 py-4 flex flex-col gap-4">
          {abRollerReps.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">今日の記録</h3>
              <div className="flex flex-wrap gap-2">
                {abRollerReps.map((r, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg px-3 py-2 text-center min-w-[48px]">
                    <div className="text-xs text-gray-500">セット{i + 1}</div>
                    <div className="text-lg font-bold">{r}</div>
                    <div className="text-xs text-gray-500">回</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {abRollerEnded || finished ? (
            <Card className="bg-green-50 border border-green-200">
              <p className="text-green-700 font-semibold mb-1">直近2セットがともに3回以下です。</p>
              <p className="text-green-600 text-sm">腹筋ローラーはここで終了です。</p>
            </Card>
          ) : (
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                セット{abRollerReps.length + 1}の回数を入力
              </h3>
              <NumberInput
                value={abRollerCurrentReps}
                onChange={setAbRollerCurrentReps}
                min={0}
                step={1}
                label="回数"
                unit="回"
              />
              <Button
                fullWidth
                className="mt-3"
                onClick={handleAbRollerAddSet}
                disabled={abRollerCurrentReps === ''}
              >
                セット{abRollerReps.length + 1}を記録
              </Button>
            </Card>
          )}

          <Button variant="secondary" fullWidth onClick={handleFinish}>
            種目を終了する
          </Button>
        </main>
      </div>
    );
  }

  const pairIdx = getPairIndexForSet(currentSetNum);
  const plannedLoad = getPairLoad(progress, currentSetNum);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-4 py-4">
        <button className="text-white/80 text-sm mb-1" onClick={() => navigate(`/session/${sessionId}`)}>← 一覧</button>
        <h1 className="text-xl font-bold">{exercise.name}</h1>
        <p className="text-sm text-white/80">{phaseLabel(progress.phase)}</p>
      </header>

      <main className="flex-1 px-4 py-4 flex flex-col gap-4">
        {completedSets > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">完了済み</h3>
            <div className="flex flex-wrap gap-2">
              {(existingSetRecords ?? []).map((r) => (
                <div key={r.id} className="bg-gray-100 rounded-lg px-3 py-2 text-center min-w-[52px]">
                  <div className="text-xs text-gray-500">S{r.setNumber}</div>
                  <div className="text-base font-bold">{r.actualLoad}{exercise.unit}</div>
                  <div className="text-xs text-gray-600">{r.actualReps}回 RIR{r.actualRir}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">今日の目標</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b">
                <th className="text-left py-1">セット</th>
                <th className="text-right py-1">目標負荷</th>
                <th className="text-right py-1">回数目安</th>
                <th className="text-right py-1">RIR</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalSets }, (_, i) => i + 1).map((n) => {
                const pi = getPairIndexForSet(n);
                const load = getPairLoad(progress, n);
                const isCurrentSet = n === currentSetNum;
                const isDone = n <= completedSets;
                return (
                  <tr
                    key={n}
                    className={[
                      'border-b border-gray-100',
                      isCurrentSet ? 'bg-blue-50' : '',
                      isDone ? 'opacity-40' : '',
                    ].join(' ')}
                  >
                    <td className="py-2 text-left font-medium">
                      {n}{isCurrentSet && <span className="ml-1 text-blue-600">←</span>}
                    </td>
                    <td className="py-2 text-right">{load}{exercise.unit}</td>
                    <td className="py-2 text-right text-xs text-gray-500">{getRepsRange(pi)}</td>
                    <td className="py-2 text-right text-xs text-gray-500">RIR0</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <h3 className="text-base font-bold text-gray-800 mb-1">
            セット{currentSetNum}を記録
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            目標：{plannedLoad}{exercise.unit} / {getRepsRange(pairIdx)} / RIR0まで（上限で止めない）
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <NumberInput
              value={inputLoad}
              onChange={setInputLoad}
              min={0}
              step={exercise.delta || 0.01}
              label="重量"
              unit={exercise.unit}
            />
            <NumberInput
              value={inputReps}
              onChange={setInputReps}
              min={0}
              step={1}
              label="回数"
              unit="回"
            />
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">実際のRIR（余力）</p>
            <div className="grid grid-cols-4 gap-2">
              {getRirOptions().map((rir) => (
                <button
                  key={rir}
                  onClick={() => setInputRir(rir)}
                  className={[
                    'rounded-lg py-3 text-sm font-semibold transition-colors',
                    inputRir === rir ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700',
                  ].join(' ')}
                >
                  RIR{rir}
                </button>
              ))}
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleSaveSet}
            disabled={inputLoad === '' || inputReps === ''}
          >
            {isLastSet ? '種目を終了する' : `セット${currentSetNum}を記録`}
          </Button>
        </Card>

        {!isLastSet && (
          <Button variant="ghost" fullWidth onClick={handleFinish}>
            ここで終了する（部分記録として保存）
          </Button>
        )}
      </main>
    </div>
  );
}
