import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook personalizado que resetea el scroll al tope de la página
 * cuando cambia la ruta. Usa useLayoutEffect para evitar parpadeos.
 */
export function useScrollToTop() {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        // Resetear scroll inmediatamente antes de que el navegador pinte
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant' // 'smooth' si quieres animación suave
        });
    }, [pathname]);
}