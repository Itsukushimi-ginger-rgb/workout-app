import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import type { Exercise, ExerciseProgress, LoadMode } from '../data/types';
import { phaseLabel } from '../logic/progression';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';

interface ExerciseEditorProps {
  exercise: Exercise;
  progress: ExerciseProgress;
}

const LOAD_MODE_LABELS: Record<LoadMode, string> = {
  external: '外部重量（バーベル・ダンベル）',
  weighted: '加重（懸垂に重りを追加）',
  assist: 'アシスト（補助重量を減らす方向）',
};

function ExerciseEditor({ exercise, progress }: ExerciseEditorProps) {
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState<number | ''>(exercise.delta);
  const [deltaAlt, setDeltaAlt] = useState<number | ''>(exercise.deltaAlt ?? '');
  const [loadMode, setLoadMode] = useState<LoadMode>(exercise.loadMode);
  const [set78Offset, setSet78Offset] = useState<1 | 2>(exercise.set78Offset);
  const [initialLoad, setInitialLoad] = useState<number | ''>(exercise.initialLoad);
  const [loadPair12, setLoadPair12] = useState<number | ''>(progress.loadPair12);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (delta === '' || initialLoad === '') return;
    setSaving(true);
    try {
      await db.exercises.update(exercise.id, {
        delta: Number(delta),
        deltaAlt: deltaAlt !== '' ? Number(deltaAlt) : undefined,
        loadMode,
        set78Offset,
        initialLoad: Number(initialLoad),
      });

      if (!progress.isSetup) {
        const load = Number(loadPair12 !== '' ? loadPair12 : initialLoad);
        await db.exerciseProgress.update(exercise.id, {
          loadPair12: load,
          isSetup: true,
        });
      } else {
        // 既存設定の更新: デルタ変更のみ（負荷はそのまま）
        await db.exerciseProgress.update(exercise.id, {});
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={progress.isSetup ? '' : 'border-2 border-red-200'}>
      <button
        className="w-full flex justify-between items-center"
        onClick={() => setOpen(!open)}
      >
        <div className="text-left">
          <p className="font-semibold text-gray-800">{exercise.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {progress.isSetup
              ? `${phaseLabel(progress.phase)} / Δ${exercise.delta}${exercise.unit} / ${LOAD_MODE_LABELS[exercise.loadMode]}`
              : '初回設定が必要'}
          </p>
        </div>
        <span className="text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-4 border-t border-gray-100 pt-4">
          {!exercise.isBodyweightOnly && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">負荷方式</p>
                <div className="flex flex-col gap-2">
                  {(Object.keys(LOAD_MODE_LABELS) as LoadMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setLoadMode(mode)}
                      className={[
                        'text-left rounded-lg px-3 py-3 text-sm border transition-colors',
                        loadMode === mode
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600',
                      ].join(' ')}
                    >
                      {LOAD_MODE_LABELS[mode]}
                    </button>
                  ))}
                </div>
              </div>

              <NumberInput
                value={delta}
                onChange={(v) => setDelta(v)}
                min={0.01}
                step={0.01}
                label={`Δ（最小変化量）${exercise.unit}`}
                unit={exercise.unit}
              />

              {exercise.deltaAlt !== undefined && (
                <NumberInput
                  value={deltaAlt}
                  onChange={setDeltaAlt}
                  min={0.01}
                  step={0.01}
                  label={`Δ（代替）${exercise.unit}`}
                  unit={exercise.unit}
                />
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">セット7・8の開始軽さ</p>
                <div className="grid grid-cols-2 gap-2">
                  {([1, 2] as const).map((offset) => (
                    <button
                      key={offset}
                      onClick={() => setSet78Offset(offset)}
                      className={[
                        'rounded-lg py-3 text-sm font-medium border transition-colors',
                        set78Offset === offset
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600',
                      ].join(' ')}
                    >
                      {offset}Δ軽い
                    </button>
                  ))}
                </div>
              </div>

              <NumberInput
                value={initialLoad}
                onChange={setInitialLoad}
                min={0}
                step={0.01}
                label="初回の開始負荷（種目設定）"
                unit={exercise.unit}
              />

              {!progress.isSetup && (
                <NumberInput
                  value={loadPair12}
                  onChange={setLoadPair12}
                  min={0}
                  step={0.01}
                  label="初回の開始負荷（セット1・2）"
                  unit={exercise.unit}
                />
              )}
            </>
          )}

          <Button fullWidth onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      )}
    </Card>
  );
}

export function SettingsScreen() {
  const navigate = useNavigate();
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const allProgress = useLiveQuery(() => db.exerciseProgress.toArray(), []);

  const progressMap = Object.fromEntries((allProgress ?? []).map((p) => [p.exerciseId, p]));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white px-4 py-4">
        <button className="text-white/70 text-sm mb-1" onClick={() => navigate('/')}>← ホーム</button>
        <h1 className="text-xl font-bold">設定</h1>
      </header>

      <main className="flex-1 px-4 py-4 flex flex-col gap-3">
        <p className="text-sm text-gray-500">種目をタップして設定を変更できます。</p>
        {(exercises ?? []).map((ex) => {
          const prog = progressMap[ex.id];
          if (!prog) return null;
          return <ExerciseEditor key={ex.id} exercise={ex} progress={prog} />;
        })}
      </main>
    </div>
  );
}
