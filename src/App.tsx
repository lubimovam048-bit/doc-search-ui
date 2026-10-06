import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import HomePage from './pages/HomePage';
import AnswerPage from './pages/AnswerPage';
import DocumentsPage from './pages/DocumentsPage';
import JournalPage from './pages/JournalPage';
import { useApp } from './context/AppContext';
import type { ReactElement } from 'react';

/** Разделы администрирования недоступны обычному пользователю. */
function AdminOnly({ children }: { children: ReactElement }) {
  const { role } = useApp();
  return role === 'admin' ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="q/:id" element={<AnswerPage />} />
        <Route path="documents" element={<AdminOnly><DocumentsPage /></AdminOnly>} />
        <Route path="journal" element={<AdminOnly><JournalPage /></AdminOnly>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
