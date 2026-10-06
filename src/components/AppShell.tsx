import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function AppShell() {
  const { pathname } = useLocation();
  // история запросов нужна только в «Ассистенте»; таблицам файлов и журнала отдаём всю ширину
  const withHistory = pathname === '/' || pathname.startsWith('/q/');
  const [histOpen, setHistOpen] = useState(false);
  // на узком экране история открывается как выезжающая панель и закрывается при переходе
  useEffect(() => setHistOpen(false), [pathname]);
  return (
    <div className="app">
      <TopNav onHistory={withHistory ? () => setHistOpen((v) => !v) : undefined} historyOpen={histOpen} />
      <div className="app__body">
        {withHistory && <Sidebar open={histOpen} />}
        {withHistory && histOpen && <div className="drawer-scrim" onClick={() => setHistOpen(false)} />}
        <Outlet />
      </div>
    </div>
  );
}
