import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Icon from './Icon';
import Sidebar from './Sidebar';

export default function AppShell() {
  const { pathname } = useLocation();
  // на узком экране меню открывается как выезжающая панель и закрывается при переходе
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="app">
      <button className="app__burger" onClick={() => setOpen((v) => !v)} aria-label="Меню" aria-expanded={open}>
        <Icon name="menu" size={20} />
      </button>
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      {open && <div className="drawer-scrim" onClick={() => setOpen(false)} />}
      <div className="app__body">
        <Outlet />
      </div>
    </div>
  );
}
