import { createContext, useContext, useState, useCallback, useEffect,
    ReactNode,
} from 'react';

interface PageHeaderData {
    title: string;
    description?: string;
}

interface PageHeaderContextValue {
    header: PageHeaderData | null;
    setHeader: (data: PageHeaderData) => void;
    resetHeader: () => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | undefined>(undefined);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
    const [header, setHeaderState] = useState<PageHeaderData | null>(null);

    const setHeader = useCallback((data: PageHeaderData) => {
        setHeaderState(data);
    }, []);

    const resetHeader = useCallback(() => {
        setHeaderState(null);
    }, []);

    return (
        <PageHeaderContext.Provider value={{ header, setHeader, resetHeader }}>
            {children}
        </PageHeaderContext.Provider>
    );
}

export function usePageHeaderContext() {
    const ctx = useContext(PageHeaderContext);
    if (!ctx) {
        throw new Error('usePageHeaderContext must be used within PageHeaderProvider');
    }
    return ctx;
}

/**
 * Hook para usar en cada página.
 * Se llama al inicio del componente:
 *
 *   usePageHeader('Pacientes', 'Listado y gestión de pacientes');
 *
 * Cuando la página se desmonta, el título se limpia solo.
 */
export function usePageHeader(title: string, description?: string) {
    const { setHeader, resetHeader } = usePageHeaderContext();

    useEffect(() => {
        setHeader({ title, description });
        return () => resetHeader();
    }, [title, description, setHeader, resetHeader]);
}