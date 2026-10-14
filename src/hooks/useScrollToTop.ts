import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        const main = document.getElementById('main-scroll');
        if (main) {
            main.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        } else {
            // Fallback por si el layout no está montado todavía
            window.scrollTo(0, 0);
        }
    }, [pathname]);
}