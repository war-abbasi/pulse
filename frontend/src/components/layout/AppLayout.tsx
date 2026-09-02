import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

/** Chrome shared by every page: the canvas background and the top navigation. */
export function AppLayout() {
  return (
    <div className="min-h-dvh bg-canvas">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <Outlet />
      </main>
    </div>
  );
}
