import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function AppShell() {
  const { pathname } = useLocation();
  // история запросов нужна только в «Ассистенте»; таблицам файлов и журнала отдаём всю ширину
  const withHistory = pathname === '/' || pathname.startsWith('/q/');
  return (
    <div className="app">
      <TopNav />
      <div className="app__body">
        {withHistory && <Sidebar />}
        <Outlet />
      </div>
    </div>
  );
}
