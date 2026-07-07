import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TRAINING_BLOCKS, type TrainingBlock } from '../data/types';
import { useActiveSession } from '../hooks/useSession';
import { useAllProgress, useExercises } from '../hooks/useExercise';
import { startSession } from '../hooks/useSession';
import { phaseLabel, getActiveSetsForPhase } from '../logic/progression';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const BLOCK_KEYS = Object.keys(TRAINING_BLOCKS) as TrainingBlock[];

export function HomeScreen() {
  const navigate = useNavigate();
  const [selectedBlock, setSelectedBlock] = useState<TrainingBlock>('chest_bicep');
  const activeSession = useActiveSession();
  const allProgress = useAllProgress();
  const exercises = useExercises();

  const progressMap = Object.fromEntries((allProgress ?? []).map((p) => [p.exerciseId, p]));
  const exerciseMap = Object.fromEntries((exercises ?? []).map((e) => [e.id, e]));

  async function handleStart() {
    const session = await startSession(selectedBlock);
    navigate(`/session/${session.id}`);
  }

  function handleResume() {
    if (activeSession) {
      navigate(`/session/${activeSession.id}`);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-blue-600 text-white px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">筋トレ記録</h1>
        <button
          className="text-white/80 text-sm"
          onClick={() => navigate('/settings')}
        >
          設定
        </button>
      </header>

      <main className="flex-1 px-4 py-4 flex flex-col gap-4">
        {/* 進行中セッションバナー */}
        {activeSession && (
          <Card className="border-2 border-orange-400 bg-orange-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-700">前回のトレーニングが途中です</p>
                <p className="text-xs text-orange-600 mt-1">
                  {TRAINING_BLOCKS[activeSession.trainingBlock].label}
                </p>
              </div>
              <Button size="sm" onClick={handleResume} className="bg-orange-500 text-white">
                続きから
              </Button>
            </div>
          </Card>
        )}

        {/* トレーニング選択 */}
        <Card>
          <h2 className="text-base font-bold text-gray-800 mb-3">今回のトレーニング</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {BLOCK_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setSelectedBlock(key)}
                className={[
                  'rounded-xl py-4 px-2 text-sm font-medium transition-colors',
                  selectedBlock === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700',
                ].join(' ')}
              >
                {TRAINING_BLOCKS[key].label}
              </button>
            ))}
          </div>

          {/* 選択中の枠のプレビュー */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            {TRAINING_BLOCKS[selectedBlock].exerciseIds.map((eid) => {
              const progress = progressMap[eid];
              const exercise = exerciseMap[eid];
              if (!progress || !exercise) return null;
              return (
                <div key={eid} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <span className="text-sm font-medium text-gray-800">{exercise.name}</span>
                  <span className="text-xs text-gray-500">
                    {progress.isSetup
                      ? `${phaseLabel(progress.phase)}・${exercise.isBodyweightOnly ? '無制限' : `${getActiveSetsForPhase(progress.phase)}セット`}`
                      : '未設定'
                    }
                  </span>
                </div>
              );
            })}
          </div>

          <Button fullWidth onClick={handleStart}>
            トレーニング開始
          </Button>
        </Card>

        {/* 各種目のステータス */}
        <Card>
          <h2 className="text-base font-bold text-gray-800 mb-3">種目の現在地</h2>
          <div className="flex flex-col gap-2">
            {(exercises ?? []).map((exercise) => {
              const progress = progressMap[exercise.id];
              if (!progress) return null;
              return (
                <button
                  key={exercise.id}
                  onClick={() => navigate(`/exercise/${exercise.id}`)}
                  className="flex justify-between items-center py-2 px-2 rounded-lg active:bg-gray-100 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{exercise.name}</p>
                    {!progress.isSetup && (
                      <p className="text-xs text-red-500">初回設定が必要</p>
                    )}
                  </div>
                  <div className="text-right">
                    {progress.isSetup ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {phaseLabel(progress.phase)}
                      </span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">未設定</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 履歴 */}
        <Button variant="secondary" fullWidth onClick={() => navigate('/history')}>
          履歴を見る
        </Button>
      </main>
    </div>
  );
}
