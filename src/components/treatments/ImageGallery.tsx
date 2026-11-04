import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Image, Plus, Camera, Trash2, Grid3x3, ChevronDown, ChevronUp, ZoomIn, ZoomOut, RotateCw, Lock, X, Eye } from 'lucide-react';
import { Media } from '@/services/media.service';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { cn } from '@/lib/utils';
import { PrivateImage } from '@/components/shared/PrivateImage';

interface ImageCarouselProps {
    images: Media[];
    isLoading?: boolean;
    onUpload?: () => void;
    onDelete?: (id: number) => void;
    treatmentName?: string;
    disabled?: boolean;
    disabledReason?: string;
    hideHeader?: boolean;
}

export function ImageCarousel({
    images, isLoading, onUpload, onDelete, treatmentName, disabled = false, disabledReason, hideHeader = false,
}: ImageCarouselProps) {
    const [selectedImage, setSelectedImage] = useState<Media | null>(null);
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
    const [showAllImages, setShowAllImages] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [visibleLimit, setVisibleLimit] = useState(4);
    const containerRef = useRef<HTMLDivElement>(null);

    const MIN_ZOOM = 1; const MAX_ZOOM = 3; const ZOOM_STEP = 0.25;

    const getDragBounds = () => {
        if (!containerRef.current) return { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity };
        const w = containerRef.current.clientWidth; const h = containerRef.current.clientHeight;
        const maxX = Math.max(0, (w * zoomLevel - w) / 2); const maxY = Math.max(0, (h * zoomLevel - h) / 2);
        return { minX: -maxX, maxX, minY: -maxY, maxY };
    };

    const clampPosition = (x: number, y: number) => {
        const b = getDragBounds();
        return { x: Math.max(b.minX, Math.min(b.maxX, x)), y: Math.max(b.minY, Math.min(b.maxY, y)) };
    };

    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    const handleZoomOut = () => setZoomLevel((prev) => {
        const next = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
    });
    const handleResetZoom = () => { setZoomLevel(1); setPosition({ x: 0, y: 0 }); };
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel > 1) { setIsDragging(true); setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); }
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoomLevel > 1) { setPosition(clampPosition(e.clientX - dragStart.x, e.clientY - dragStart.y)); }
    };
    const handleMouseUp = () => setIsDragging(false);
    const handleOpenChange = (open: boolean) => { setIsFullscreenOpen(open); if (!open) handleResetZoom(); };

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isFullscreenOpen) return;
        const handleWheelEvent = (e: WheelEvent) => {
            e.preventDefault();
            if (e.deltaY < 0) handleZoomIn(); else handleZoomOut();
        };
        container.addEventListener('wheel', handleWheelEvent, { passive: false });
        return () => container.removeEventListener('wheel', handleWheelEvent);
    }, [zoomLevel, isFullscreenOpen]);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const update = () => setVisibleLimit(mq.matches ? 5 : 4);
        update(); mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    if (isLoading) {
        return (
            <Card className="border-0 shadow-sm">
                {!hideHeader && (
                    <CardHeader className="border-b bg-gray-50/50 px-4 md:px-6 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <Image className="h-5 w-5 text-primary-600 shrink-0" />
                                <CardTitle className="text-base md:text-lg truncate">Galería de Imágenes</CardTitle>
                                <Skeleton className="h-5 w-16 shrink-0" />
                            </div>
                            <Skeleton className="h-9 w-24 md:w-32 shrink-0" />
                        </div>
                    </CardHeader>
                )}
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!images || images.length === 0) {
        return (
            <Card className="border-0 shadow-sm">
                {!hideHeader && (
                    <CardHeader className="border-b bg-gray-50/50 px-4 md:px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                <Image className="h-5 w-5 text-primary-600 shrink-0" />
                                <CardTitle className="text-base md:text-lg truncate">Galería de Imágenes</CardTitle>
                                <Badge variant="outline" className="shrink-0">0 imágenes</Badge>
                            </div>
                            {onUpload && (
                                <Button onClick={onUpload} disabled={disabled} className="gap-2 rounded-lg w-full sm:w-auto shrink-0" size="sm" title={disabled ? disabledReason : undefined}>
                                    <Plus className="h-4 w-4" /> Agregar Imagen
                                </Button>
                            )}
                        </div>
                        {disabled && disabledReason && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500"><Lock className="h-3 w-3 shrink-0" /><span>{disabledReason}</span></div>
                        )}
                    </CardHeader>
                )}
                <CardContent className="py-10 md:py-12 px-4 text-center text-gray-500">
                    <div className="mx-auto h-16 w-16 md:h-20 md:w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <Camera className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
                    </div>
                    <p className="text-base md:text-lg font-medium text-gray-700">Sin imágenes registradas</p>
                    <p className="text-sm mt-1 max-w-md mx-auto">Sube imágenes del tratamiento o sesiones para documentar el proceso</p>
                    {onUpload && (
                        <Button onClick={onUpload} disabled={disabled} className="mt-5 gap-2 rounded-lg w-full sm:w-auto max-w-xs mx-auto" title={disabled ? disabledReason : undefined}>
                            <Plus className="h-4 w-4" /> Subir primera imagen
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    const visibleImages = showAllImages ? images : images.slice(0, visibleLimit);
    const hasMoreImages = images.length > visibleLimit;

    return (
        <>
            <Card className="border-0 shadow-sm">
                {!hideHeader && (
                    <CardHeader className="border-b bg-gray-50/50 px-4 md:px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-wrap">
                                <Grid3x3 className="h-5 w-5 text-primary-600 shrink-0" />
                                <CardTitle className="text-base md:text-lg shrink-0">Galería de Imágenes</CardTitle>
                                <Badge variant="outline" className="shrink-0">{images.length} {images.length === 1 ? 'imagen' : 'imágenes'}</Badge>
                                {treatmentName && <span className="text-sm text-gray-500 hidden lg:inline truncate max-w-[200px]">• {treatmentName}</span>}
                            </div>
                            {onUpload && (
                                <Button onClick={onUpload} disabled={disabled} className="gap-2 rounded-lg w-full sm:w-auto shrink-0" size="sm">
                                    <Plus className="h-4 w-4" /> Agregar Imagen
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                )}
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
                        {visibleImages.map((image) => (
                            <div
                                key={image.id}
                                className={cn('group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer ring-1 ring-gray-200/70 hover:ring-2 hover:ring-primary-400 transition-all duration-200')}
                                onClick={() => { setSelectedImage(image); setIsFullscreenOpen(true); }}
                            >
                                <PrivateImage imageKey={image.filePath} alt={image.title || image.fileName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center justify-center">
                                    <div className="h-10 w-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg"><Eye className="h-5 w-5 text-gray-800" /></div>
                                </div>

                                {image.sessionId && (
                                    <Badge className="absolute top-1.5 right-1.5 text-[10px] bg-black/60 backdrop-blur-sm text-white border-0 px-1.5 py-0.5">S{image.sessionId}</Badge>
                                )}

                                {onDelete && !disabled && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); if (confirm('¿Estás seguro de eliminar esta imagen?')) onDelete(image.id); }}
                                        className={cn('absolute top-1.5 left-1.5 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-lg ring-2 ring-white/90 opacity-90 sm:opacity-0 sm:group-hover:opacity-100')}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {hasMoreImages && (
                        <div className="flex justify-center mt-5 md:mt-6">
                            <Button variant="outline" onClick={() => setShowAllImages(!showAllImages)} className="gap-2 px-5 w-full sm:w-auto" size="sm">
                                {showAllImages ? <><ChevronUp className="h-4 w-4" /> Mostrar menos</> : <><ChevronDown className="h-4 w-4" /> Mostrar todas ({images.length})</>}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFullscreenOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="p-0 m-0 bg-transparent border-0 rounded-none shadow-none [&>button]:hidden">
                    <VisuallyHidden><DialogTitle>Visor de imagen</DialogTitle></VisuallyHidden>
                    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-black/90 overflow-hidden" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>

                        <PrivateImage
                            imageKey={selectedImage?.filePath}
                            alt={selectedImage?.title || ''}
                            className={cn('object-contain transition-transform duration-200 ease-out select-none', isDragging && 'cursor-grabbing', zoomLevel > 1 && 'cursor-grab')}
                            style={{ width: '100%', height: '100%', transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)` }}
                        />

                        <button type="button" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center z-30" onClick={() => handleOpenChange(false)}>
                            <X className="h-5 w-5" />
                        </button>

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 rounded-xl p-1.5 z-20">
                            <button onClick={handleZoomOut} disabled={zoomLevel <= MIN_ZOOM} className="h-8 w-8 text-white disabled:opacity-40"><ZoomOut className="h-4 w-4 mx-auto" /></button>
                            <span className="text-xs text-white min-w-[40px] text-center">{Math.round(zoomLevel * 100)}%</span>
                            <button onClick={handleZoomIn} disabled={zoomLevel >= MAX_ZOOM} className="h-8 w-8 text-white disabled:opacity-40"><ZoomIn className="h-4 w-4 mx-auto" /></button>
                            {zoomLevel > 1 && <button onClick={handleResetZoom} className="h-8 w-8 text-white"><RotateCw className="h-4 w-4 mx-auto" /></button>}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}