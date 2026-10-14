import { useEffect, useState } from 'react';

const SCROLL_CONTAINER_ID = 'main-scroll';
const THRESHOLD = 10; // ignorar micro-scrolls (evita flickering)
const TOP_OFFSET = 80; // siempre mostrar cuando estás arriba del todo

export function useScrollDirection(): 'up' | 'down' {
    const [direction, setDirection] = useState<'up' | 'down'>('up');

    useEffect(() => {
        let lastScrollY = 0;
        let ticking = false;

        // Obtener el contenedor correcto: #main-scroll si existe, window si no
        const getScroller = (): HTMLElement | Window => {
            if (typeof document === 'undefined') return window;
            const el = document.getElementById(SCROLL_CONTAINER_ID);
            return el || window;
        };

        const getScrollY = (scroller: HTMLElement | Window): number => {
            if (scroller instanceof HTMLElement) return scroller.scrollTop;
            return window.scrollY;
        };

        const handleScroll = () => {
            if (ticking) return;
            ticking = true;

            requestAnimationFrame(() => {
                const scroller = getScroller();
                const currentY = getScrollY(scroller);
                const delta = currentY - lastScrollY;

                // Ignorar micro-movimientos (flickering)
                if (Math.abs(delta) < THRESHOLD) {
                    ticking = false;
                    return;
                }

                // Siempre mostrar cuando estamos cerca del top
                if (currentY < TOP_OFFSET) {
                    setDirection('up');
                } else if (delta > 0) {
                    setDirection('down'); // scrolleando hacia abajo → ocultar FAB
                } else {
                    setDirection('up'); // scrolleando hacia arriba → mostrar FAB
                }

                lastScrollY = currentY;
                ticking = false;
            });
        };

        // Adjuntar listener al contenedor correcto
        const scroller = getScroller();
        scroller.addEventListener('scroll', handleScroll, { passive: true });

        // Inicializar con la posición actual
        lastScrollY = getScrollY(scroller);

        // Si el layout cambia (por ejemplo, se monta el main-scroll después),
        // re-adjuntar el listener
        const observer = new MutationObserver(() => {
            const newScroller = getScroller();
            if (newScroller !== scroller) {
                scroller.removeEventListener('scroll', handleScroll);
                newScroller.addEventListener('scroll', handleScroll, { passive: true });
                lastScrollY = getScrollY(newScroller);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            scroller.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, []);

    return direction;
}