import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { TRAINING_BLOCKS } from '../data/types';
import { useExercises, useAllProgress } from '../hooks/useExercise';
import { skipExercise } from '../hooks/useSession';
import { phaseLabel, getActiveSetsForPhase } from '../logic/progression';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function SessionScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const session = useLiveQuery(
    () => sessionId ? db.sessions.get(sessionId) : undefined,
    [sessionId],
  );

  const exercises = useExercises();
  const allProgress = useAllProgress();

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">セッションが見つかりません</p>
      </div>
    );
  }

  const progressMap = Object.fromEntries((allProgress ?? []).map((p) => [p.exerciseId, p]));
  const exerciseMap = Object.fromEntries((exercises ?? []).map((e) => [e.id, e]));
  const blockLabel = TRAINING_BLOCKS[session.trainingBlock].label;

  // セッション完了
  if (session.status === 'completed') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-green-600 text-white px-4 py-4">
          <h1 className="text-xl font-bold">トレーニング完了！</h1>
        </header>
        <main className="flex-1 px-4 py-6 flex flex-col gap-4">
          <Card>
            <p className="text-center text-lg font-semibold text-gray-800 mb-2">{blockLabel}</p>
            <p className="text-center text-gray-500 text-sm">お疲れ様でした！</p>
          </Card>
          <Button fullWidth onClick={() => navigate('/')}>
            ホームに戻る
          </Button>
        </main>
      </div>
    );
  }

  const activeExerciseId = session.currentExerciseId;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-4 py-4">
        <button className="text-white/80 text-sm mb-1" onClick={() => navigate('/')}>← ホーム</button>
        <h1 className="text-xl font-bold">{blockLabel}</h1>
      </header>

      <main className="flex-1 px-4 py-4 flex flex-col gap-3">
        {session.exerciseIds.map((eid) => {
          const exercise = exerciseMap[eid];
          const progress = progressMap[eid];
          const isSkipped = session.skippedExerciseIds.includes(eid);
          const isCompleted = session.completedExerciseIds.includes(eid);
          const isActive = eid === activeExerciseId;

          if (!exercise || !progress) return null;

          const statusLabel = isSkipped ? 'スキップ' : isCompleted ? '完了' : isActive ? '実施中' : '待機中';
          const statusColor = isSkipped
            ? 'bg-gray-100 text-gray-500'
            : isCompleted
            ? 'bg-green-100 text-green-700'
            : isActive
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-50 text-gray-400';

          return (
            <Card key={eid} className={isActive ? 'border-2 border-blue-400' : ''}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{exercise.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {progress.isSetup
                      ? `${phaseLabel(progress.phase)}・${exercise.isBodyweightOnly ? '無制限セット' : `${getActiveSetsForPhase(progress.phase)}セット`}`
                      : '初回設定が必要'
                    }
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>

              {isActive && !isSkipped && !isCompleted && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      await skipExercise(session.id, eid);
                    }}
                  >
                    スキップ
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/session/${session.id}/exercise/${eid}`)}
                  >
                    記録する
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </main>
    </div>
  );
}
