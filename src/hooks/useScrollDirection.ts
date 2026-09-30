import { useState, useEffect } from 'react';

type ScrollDirection = 'up' | 'down';

export function useScrollDirection(threshold = 10): ScrollDirection {
    const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('up');
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        let ticking = false;

        const updateScrollDirection = () => {
            const scrollY = window.scrollY;

            // Ignorar cambios pequeños
            if (Math.abs(scrollY - lastScrollY) < threshold) {
                ticking = false;
                return;
            }

            const direction: ScrollDirection = scrollY > lastScrollY ? 'down' : 'up';

            // Solo actualizar si cambia la dirección
            if (direction !== scrollDirection) {
                setScrollDirection(direction);
            }

            setLastScrollY(scrollY > 0 ? scrollY : 0);
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateScrollDirection);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [scrollDirection, lastScrollY, threshold]);

    return scrollDirection;
}