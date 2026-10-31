import { useCallback, useLayoutEffect, useRef } from 'react';

interface PendingScroll {
  window: number;
  scrollables: Array<{ el: HTMLElement; top: number; label: string }>;
}

export function useScrollSafeUpdate() {
  const pendingRef = useRef<PendingScroll | null>(null);

  useLayoutEffect(() => {
    const pending = pendingRef.current;
    if (!pending) {
      console.log('🎯 [scroll-hook] layoutEffect SIN pending (nada que restaurar)');
      return;
    }

    pendingRef.current = null;

    // Snapshot ANTES de restaurar
    const beforeWindow = window.scrollY;
    const maxWindow = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );

    console.log('🎯 [scroll-hook] RESTAURANDO:', {
      capturedWindow: pending.window,
      beforeRestoreWindow: beforeWindow,
      maxWindow,
      willScrollTo: Math.min(pending.window, maxWindow),
      scrollables: pending.scrollables.map((s) => ({
        label: s.label,
        capturedTop: s.top,
        currentTop: s.el.isConnected ? s.el.scrollTop : 'DISCONNECTED',
        scrollHeight: s.el.isConnected ? s.el.scrollHeight : null,
        clientHeight: s.el.isConnected ? s.el.clientHeight : null,
        maxScroll: s.el.isConnected
          ? Math.max(0, s.el.scrollHeight - s.el.clientHeight)
          : null,
      })),
    });

    // Restaurar scroll del documento
    const targetWindow = Math.min(pending.window, maxWindow);
    if (window.scrollY !== targetWindow) {
      window.scrollTo(0, targetWindow);
    }

    // Restaurar scroll de cada contenedor interno
    pending.scrollables.forEach(({ el, top, label }) => {
      if (!el.isConnected) {
        console.log(`🎯 [scroll-hook] ${label}: elemento desconectado, skip`);
        return;
      }
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
      const target = Math.min(top, maxScroll);
      if (el.scrollTop !== target) {
        console.log(`🎯 [scroll-hook] ${label}: restaurando ${el.scrollTop} → ${target}`);
        el.scrollTop = target;
      } else {
        console.log(`🎯 [scroll-hook] ${label}: ya en ${target}, no-op`);
      }
    });
  });

  return useCallback((updateFn: () => void, label = 'unknown') => {
    console.log(`🎯 [scroll-hook] CAPTURANDO antes de "${label}"`, {
      windowScrollY: window.scrollY,
      documentHeight: document.documentElement.scrollHeight,
    });

    const scrollables: Array<{ el: HTMLElement; top: number; label: string }> = [];
    document
      .querySelectorAll<HTMLElement>('[data-scroll-preserve]')
      .forEach((el, idx) => {
        scrollables.push({
          el,
          top: el.scrollTop,
          label: el.getAttribute('data-scroll-preserve') || `scrollable-${idx}`,
        });
        console.log(
          `🎯 [scroll-hook]   → ${el.getAttribute('data-scroll-preserve') || `scrollable-${idx}`}: scrollTop=${el.scrollTop} (scrollHeight=${el.scrollHeight}, clientHeight=${el.clientHeight})`,
        );
      });

    pendingRef.current = {
      window: window.scrollY,
      scrollables,
    };

    updateFn();
  }, []);
}