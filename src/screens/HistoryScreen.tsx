import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { phaseLabel } from '../logic/progression';
import { Card } from '../components/ui/Card';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function HistoryScreen() {
  const navigate = useNavigate();
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const workoutRecords = useLiveQuery(() => db.workoutRecords.reverse().sortBy('performedAt'), []);

  const exerciseMap = Object.fromEntries((exercises ?? []).map((e) => [e.id, e]));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white px-4 py-4">
        <button className="text-white/70 text-sm mb-1" onClick={() => navigate('/')}>← ホーム</button>
        <h1 className="text-xl font-bold">履歴</h1>
      </header>

      <main className="flex-1 px-4 py-4 flex flex-col gap-4">
        {(!workoutRecords || workoutRecords.length === 0) ? (
          <Card>
            <p className="text-center text-gray-500 py-8">まだ記録がありません</p>
          </Card>
        ) : (
          (workoutRecords ?? []).map((record) => {
            const exercise = exerciseMap[record.exerciseId];
            if (!exercise) return null;
            const prescription = (() => {
              try { return JSON.parse(record.nextPrescription); } catch { return null; }
            })();

            return (
              <Card key={record.id}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{exercise.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(record.performedAt)}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {phaseLabel(record.phaseAtStart)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {record.setRecords.map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded px-2 py-1 text-xs text-center">
                      <span className="text-gray-400">S{s.setNumber}</span>{' '}
                      {!exercise.isBodyweightOnly && <span>{s.actualLoad}{exercise.unit}</span>}{' '}
                      <span className="font-medium">{s.actualReps}回</span>
                    </div>
                  ))}
                </div>

                {prescription && prescription.verdictMessages?.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">{prescription.verdictMessages[0]}</p>
                )}
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
