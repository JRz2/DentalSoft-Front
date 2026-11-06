import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, X, Loader2, Maximize2, Minimize2, ExternalLink, FileText, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Description } from '@radix-ui/react-dialog';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pdfBlob: Blob | null;
    fileName: string;
    title: string;
}

export function PdfPreviewModal({ open, onOpenChange, pdfBlob, fileName, title }: PdfPreviewModalProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [numPages, setNumPages] = useState<number>(1);

    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [zoom, setZoom] = useState<number>(1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open || !pdfBlob) {
            setPdfUrl(null);
            setLoading(false);
            setError(false);
            setNumPages(1);
            setContainerWidth(0);
            setZoom(1);
            return;
        }

        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setLoading(true);
        setError(false);

        return () => URL.revokeObjectURL(url);
    }, [open, pdfBlob]);

    useEffect(() => {
        if (!open) return;

        const updateWidth = () => {
            if (containerRef.current) {
                const width = containerRef.current.getBoundingClientRect().width;
                if (width > 0) {
                    setContainerWidth(width);
                }
            }
        };

        const timer = setTimeout(updateWidth, 150);
        const observer = new ResizeObserver(updateWidth);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [open, fullscreen]);

    const normalizedFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;

    const handleDownload = () => {
        if (!pdfUrl) return;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = normalizedFileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handlePrint = () => {
        if (!pdfUrl) return;
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
            printWindow.onload = () => printWindow.print();
        }
    };

    const handleOpenNewTab = () => {
        if (!pdfUrl) return;
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    };

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) setFullscreen(false);
        onOpenChange(nextOpen);
    };

    const baseWidth = containerWidth > 0 ? Math.min(containerWidth, 750) : 0;
    const rawPageWidth = baseWidth * zoom;
    const pageWidth = Number.isFinite(rawPageWidth) && rawPageWidth > 0 ? rawPageWidth : 750;

    const safeNumPages = Number.isFinite(numPages) && numPages > 0 ? numPages : 1;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <Description className="text-sm text-muted-foreground">
                Previsualización de PDF
            </Description>
            <DialogContent
                showCloseButton={false}
                className="!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !grid !grid-rows-[auto_minmax(0,1fr)_auto] !gap-0 !p-0 !max-w-none overflow-hidden rounded-xl border border-border/70 bg-background shadow-2xl"
                style={{
                    width: fullscreen ? '98vw' : '95vw',
                    maxWidth: fullscreen ? 'none' : '1000px',
                    height: fullscreen ? '96dvh' : '90dvh',
                    maxHeight: '96dvh',
                }}
            >
                {/* ENCABEZADO */}
                <header className="z-10 flex min-w-0 items-center justify-between gap-2 border-b bg-background px-3 py-3 sm:px-5">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="truncate text-sm font-semibold sm:text-base">
                                {title}
                            </DialogTitle>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {normalizedFileName}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        {/* CONTROLES DE ZOOM */}
                        <div className="flex items-center gap-1 bg-muted/50 rounded-md px-1 mr-1 sm:mr-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(p => Math.max(0.5, p - 0.25))} disabled={!pdfUrl || zoom <= 0.5}>
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-xs font-medium w-9 text-center select-none">
                                {Math.round(zoom * 100)}%
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(p => Math.min(3, p + 0.25))} disabled={!pdfUrl || zoom >= 3}>
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button variant="ghost" size="icon" onClick={handleOpenNewTab} disabled={!pdfUrl} className="hidden sm:inline-flex">
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setFullscreen(p => !p)} className="hidden sm:inline-flex">
                            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handlePrint} disabled={!pdfUrl || loading || error} className="hidden sm:inline-flex">
                            <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="default" size="sm" onClick={handleDownload} disabled={!pdfUrl} className="h-9 gap-2 px-3 hidden sm:flex">
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Descargar</span>
                        </Button>
                        <Button variant="default" size="icon" onClick={handleDownload} disabled={!pdfUrl} className="h-9 w-9 sm:hidden">
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleClose(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </header>

                {/* VISOR DEL DOCUMENTO */}
                <main className="relative min-h-0 min-w-0 overflow-auto bg-slate-200/60 dark:bg-slate-900/50 p-4">
                    <div ref={containerRef} className="w-full flex flex-col">
                        <div className="w-max min-w-full mx-auto flex flex-col items-center gap-4 pb-4">
                            {pdfUrl && !error && containerWidth > 0 ? (
                                <Document
                                    file={pdfUrl}
                                    onLoadSuccess={({ numPages: loadedPages }) => {
                                        setNumPages(Number.isFinite(loadedPages) && loadedPages > 0 ? loadedPages : 1);
                                        setLoading(false);
                                    }}
                                    onLoadError={() => { setLoading(false); setError(true); }}
                                    loading={null}
                                    className="flex flex-col gap-4"
                                >
                                    {Array.from({ length: safeNumPages }, (_, index) => (
                                        <Page
                                            key={`page_${index + 1}_${Math.round(pageWidth)}`}
                                            pageNumber={index + 1}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                            className="shadow-xl rounded-sm overflow-hidden bg-white shrink-0"
                                            width={pageWidth}
                                        />
                                    ))}
                                </Document>
                            ) : null}

                            {loading && !error && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-muted/50">
                                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Preparando documento</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-background">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                                        <AlertCircle className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">No se pudo mostrar el PDF</p>
                                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">Intenta abrir el documento en otra pestaña o descargarlo.</p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <Button variant="outline" onClick={handleOpenNewTab}>
                                            <ExternalLink className="mr-2 h-4 w-4" /> Abrir documento
                                        </Button>
                                        <Button onClick={handleDownload}>
                                            <Download className="mr-2 h-4 w-4" /> Descargar PDF
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* PIE */}
                <footer className="flex shrink-0 items-center justify-between gap-3 border-t bg-background px-4 py-2 sm:px-5">
                    <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <p className="truncate text-xs text-muted-foreground">Documento PDF Oficial</p>
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">
                        {safeNumPages} {safeNumPages === 1 ? 'Página' : 'Páginas'}
                    </p>
                </footer>
            </DialogContent>
        </Dialog>
    );
}