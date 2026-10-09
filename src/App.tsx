import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import HomePage from './pages/HomePage';
import AnswerPage from './pages/AnswerPage';
import DocumentPage from './pages/DocumentPage';
import FilesPage from './pages/FilesPage';
import JournalPage from './pages/JournalPage';
import { FEATURES } from './config';
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
      <Route path="doc/:id" element={<DocumentPage />} />
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="q/:id" element={<AnswerPage />} />
        <Route path="files" element={<AdminOnly><FilesPage /></AdminOnly>} />
        <Route path="documents" element={<Navigate to="/files" replace />} />
        {FEATURES.journal && <Route path="journal" element={<AdminOnly><JournalPage /></AdminOnly>} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
