import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShell() {
  return (
    <div className="app">
      <div className="blob blob--1" aria-hidden="true" />
      <div className="blob blob--2" aria-hidden="true" />
      <Sidebar />
      <Outlet />
    </div>
  );
}
