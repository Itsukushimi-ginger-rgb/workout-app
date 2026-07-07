import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import type { WorkoutRecord } from '../data/types';
import { phaseLabel, getActiveSetsForPhase } from '../logic/progression';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const PAIR_LABELS = ['1・2', '3・4', '5・6', '7・8'];

function formatDate(iso?: string): string {
  if (!iso) return '未実施';
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function ExerciseDetailScreen() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();

  const exercise = useLiveQuery(() => exerciseId ? db.exercises.get(exerciseId) : undefined, [exerciseId]);
  const progress = useLiveQuery(() => exerciseId ? db.exerciseProgress.get(exerciseId) : undefined, [exerciseId]);
  const history = useLiveQuery<WorkoutRecord[]>(
    () => exerciseId
      ? db.workoutRecords.where('exerciseId').equals(exerciseId).reverse().sortBy('performedAt')
      : Promise.resolve([] as WorkoutRecord[]),
    [exerciseId],
  );

  if (!exercise || !progress) {
    return <div className="flex items-center justify-center min-h-screen"><p>読み込み中...</p></div>;
  }

  const pairLoads = [progress.loadPair12, progress.loadPair34, progress.loadPair56, progress.loadPair78];
  const activeSets = exercise.isBodyweightOnly ? null : getActiveSetsForPhase(progress.phase);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white px-4 py-4">
        <button className="text-white/70 text-sm mb-1" onClick={() => navigate('/')}>← ホーム</button>
        <h1 className="text-xl font-bold">{exercise.name}</h1>
      </header>

      <main className="flex-1 px-4 py-4 flex flex-col gap-4">
        <Card>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">現在地</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">フェーズ</span>
            <span className="font-semibold text-blue-600">{phaseLabel(progress.phase)}</span>
          </div>
          {activeSets && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">今日のセット数</span>
              <span className="font-semibold">
                {activeSets}セット{progress.phase === 'final' && progress.dropUnlocked ? '＋ドロップ' : ''}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">最終実施日</span>
            <span className="text-sm">{formatDate(progress.lastPerformedAt)}</span>
          </div>
        </Card>

        {!exercise.isBodyweightOnly && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">各セットペアの現在負荷</h3>
            {PAIR_LABELS.map((label, i) => {
              const load = pairLoads[i];
              const isActive = activeSets !== null && (i + 1) * 2 <= activeSets;
              if (!isActive && load === 0) return null;
              return (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">セット{label}</span>
                  <span className={`font-semibold ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                    {load > 0 ? `${load}${exercise.unit}` : '未設定'}
                  </span>
                </div>
              );
            })}
            {progress.dropUnlocked && progress.loadDrop > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">ドロップセット</span>
                <span className="font-semibold">{progress.loadDrop}{exercise.unit}</span>
              </div>
            )}
          </Card>
        )}

        {!exercise.isBodyweightOnly && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">未達連続回数</h3>
            <p className="text-xs text-gray-400 mb-2">2回連続で次のセットペアが解放されます</p>
            {[
              { label: 'セット1・2', count: progress.failCountPair12 },
              { label: 'セット3・4', count: progress.failCountPair34 },
              { label: 'セット5・6', count: progress.failCountPair56 },
              { label: 'セット7・8', count: progress.failCountPair78 },
            ].map(({ label, count }) => (
              <div key={label} className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600">{label}</span>
                <div className="flex gap-1">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full ${i < count ? 'bg-orange-400' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </Card>
        )}

        <Card>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">最近の記録</h3>
          {(history ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">記録がありません</p>
          ) : (
            (history ?? []).slice(0, 5).map((record) => (
              <div key={record.id} className="py-2 border-b border-gray-100 last:border-0">
                <p className="text-xs text-gray-400 mb-1">
                  {new Date(record.performedAt).toLocaleDateString('ja-JP')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {record.setRecords.map((s, i) => (
                    <span key={i} className="text-xs bg-gray-100 rounded px-2 py-1">
                      {!exercise.isBodyweightOnly && `${s.actualLoad}${exercise.unit} `}{s.actualReps}回
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </Card>

        <Button variant="secondary" fullWidth onClick={() => navigate('/settings')}>
          種目の設定を変更
        </Button>
      </main>
    </div>
  );
}
