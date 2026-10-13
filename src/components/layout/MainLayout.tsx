import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export const MainLayout = () => {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Sincronizar el estado del sidebar cuando cambia el breakpoint
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Backdrop oscuro en mobile cuando el sidebar está abierto */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — en desktop es columna, en mobile es drawer */}
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobile={isMobile}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* main-scroll: único elemento con scroll vertical.
            pb-20 en mobile para no quedar tapado por el bottom nav. */}
        <main
          id="main-scroll"
          className="flex-1 overflow-y-auto p-0 md:p-6 pb-28 lg:pb-6"
        >
          <Outlet />
        </main>
      </div>

      {/* Bottom navigation — solo en mobile */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
};