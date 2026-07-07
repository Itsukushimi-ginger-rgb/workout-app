import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { db } from './data/db';
import { seedDatabase } from './data/seeds';
import { HomeScreen } from './screens/HomeScreen';
import { SessionScreen } from './screens/SessionScreen';
import { ExerciseRecordScreen } from './screens/ExerciseRecordScreen';
import { PrescriptionScreen } from './screens/PrescriptionScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ExerciseDetailScreen } from './screens/ExerciseDetailScreen';

export default function App() {
  useEffect(() => {
    seedDatabase(db as any);
  }, []);

  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/session/:sessionId" element={<SessionScreen />} />
          <Route path="/session/:sessionId/exercise/:exerciseId" element={<ExerciseRecordScreen />} />
          <Route path="/session/:sessionId/exercise/:exerciseId/result" element={<PrescriptionScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/exercise/:exerciseId" element={<ExerciseDetailScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
