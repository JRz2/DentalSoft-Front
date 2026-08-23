import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Image, Plus, Camera, Download, Trash2, Grid3x3, ChevronDown, ChevronUp,
    ZoomIn, ZoomOut, RotateCw
} from 'lucide-react';
import { Media } from '@/services/media.service';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
    images: Media[];
    isLoading?: boolean;
    onUpload?: () => void;
    onDelete?: (id: number) => void;
    treatmentName?: string;
}

const mediaTypeLabels: Record<string, string> = {
    IMAGE: 'Imagen',
    VIDEO: 'Video',
    DOCUMENT: 'Documento',
    XRAY: 'Radiografía',
    SCAN: 'Escáner',
    OTHER: 'Otro',
};

const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    if (path.startsWith('/')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        return `${cleanBaseUrl}${path}`;
    }
    return path;
};

export function ImageCarousel({
    images,
    isLoading,
    onUpload,
    onDelete,
    treatmentName
}: ImageCarouselProps) {
    const [selectedImage, setSelectedImage] = useState<Media | null>(null);
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
    const [showAllImages, setShowAllImages] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const MIN_ZOOM = 1;
    const MAX_ZOOM = 3;
    const ZOOM_STEP = 0.25;

    // ✅ Calcular límites de arrastre
    const getDragBounds = () => {
        if (!containerRef.current) return { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity };
        
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        const imgWidth = containerWidth;
        const imgHeight = containerHeight;
        
        const scaledWidth = imgWidth * zoomLevel;
        const scaledHeight = imgHeight * zoomLevel;
        
        const maxX = Math.max(0, (scaledWidth - imgWidth) / 2);
        const maxY = Math.max(0, (scaledHeight - imgHeight) / 2);
        
        return {
            minX: -maxX,
            maxX: maxX,
            minY: -maxY,
            maxY: maxY
        };
    };

    // ✅ Limitar posición dentro de los bordes
    const clampPosition = (x: number, y: number) => {
        const bounds = getDragBounds();
        return {
            x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
            y: Math.max(bounds.minY, Math.min(bounds.maxY, y))
        };
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => {
            const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
            if (newZoom === 1) {
                setPosition({ x: 0, y: 0 });
            }
            return newZoom;
        });
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoomLevel > 1) {
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            const clamped = clampPosition(newX, newY);
            setPosition(clamped);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Resetear zoom al cerrar modal
    const handleOpenChange = (open: boolean) => {
        setIsFullscreenOpen(open);
        if (!open) {
            handleResetZoom();
        }
    };

    // ✅ useEffect para manejar el wheel con passive: false
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheelEvent = (e: WheelEvent) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                handleZoomIn();
            } else {
                handleZoomOut();
            }
        };

        container.addEventListener('wheel', handleWheelEvent, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheelEvent);
        };
    }, [zoomLevel]);

    if (isLoading) {
        return (
            <Card className="border-0 shadow-sm">
                <CardHeader className="border-b bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Image className="h-5 w-5 text-primary-600" />
                            <CardTitle>Galería de Imágenes</CardTitle>
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-9 w-32" />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="aspect-square rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!images || images.length === 0) {
        return (
            <Card className="border-0 shadow-sm">
                <CardHeader className="border-b bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Image className="h-5 w-5 text-primary-600" />
                            <CardTitle>Galería de Imágenes</CardTitle>
                            <Badge variant="outline">0 imágenes</Badge>
                        </div>
                        {onUpload && (
                            <Button onClick={onUpload} className="gap-2" size="sm">
                                <Plus className="h-4 w-4" />
                                Agregar Imagen
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="py-12 text-center text-gray-500">
                    <Camera className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-600">Sin imágenes registradas</p>
                    <p className="text-sm">Sube imágenes del tratamiento o sesiones para documentar el proceso</p>
                    {onUpload && (
                        <Button onClick={onUpload} className="mt-4 gap-2" variant="outline">
                            <Plus className="h-4 w-4" />
                            Subir primera imagen
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    const visibleImages = showAllImages ? images : images.slice(0, 5);
    const hasMoreImages = images.length > 5;

    return (
        <>
            <Card className="border-0 shadow-sm">
                <CardHeader className="border-b bg-gray-50/50">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <Grid3x3 className="h-5 w-5 text-primary-600" />
                            <CardTitle>Galería de Imágenes</CardTitle>
                            <Badge variant="outline">
                                {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
                            </Badge>
                            {treatmentName && (
                                <span className="text-sm text-gray-500 hidden sm:inline">
                                    • {treatmentName}
                                </span>
                            )}
                        </div>
                        {onUpload && (
                            <Button onClick={onUpload} className="gap-2 rounded-lg" size="sm">
                                <Plus className="h-4 w-4" />
                                Agregar Imagen
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {/* Grid de imágenes */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {visibleImages.map((image) => (
                            <div
                                key={image.id}
                                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                                onClick={() => {
                                    setSelectedImage(image);
                                    setIsFullscreenOpen(true);
                                }}
                            >
                                <img
                                    src={getImageUrl(image.filePath)}
                                    alt={image.title || image.fileName}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />

                                {/* Overlay con información al hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <p className="text-white text-sm font-medium truncate">
                                            {image.title || 'Sin título'}
                                        </p>
                                        {image.sessionId && (
                                            <Badge className="mt-1 text-xs bg-white/20 text-white border-0">
                                                Sesión {image.sessionId}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Badge de sesión (visible siempre) */}
                                {image.sessionId && (
                                    <Badge className="absolute top-2 right-2 text-xs bg-black/50 text-white border-0">
                                        Sesión {image.sessionId}
                                    </Badge>
                                )}

                                {/* Botón eliminar (hover) */}
                                {onDelete && (
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('¿Estás seguro de eliminar esta imagen?')) {
                                                onDelete(image.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}

                                {/* Indicador de tipo */}
                                <div className="absolute bottom-2 left-2">
                                    <Badge variant="outline" className="text-[10px] bg-black/50 text-white border-0">
                                        {mediaTypeLabels[image.mediaType] || image.mediaType}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Botón Show More */}
                    {hasMoreImages && (
                        <div className="flex justify-center mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowAllImages(!showAllImages)}
                                className="gap-2 px-6"
                            >
                                {showAllImages ? (
                                    <>
                                        <ChevronUp className="h-4 w-4" />
                                        Mostrar menos
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4" />
                                        Mostrar todas ({images.length} imágenes)
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Pie de página con información adicional */}
                    {images.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                            <span>Haz clic en cualquier imagen para verla en tamaño completo</span>
                            {images.some(img => img.sessionId) && (
                                <span className="ml-2 text-gray-400">
                                    • Las imágenes con etiqueta "Sesión" pertenecen a una sesión específica
                                </span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal con zoom - Con límites de arrastre */}
            <Dialog open={isFullscreenOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="p-0 m-0 bg-transparent border-0 rounded-none shadow-none">
                    <VisuallyHidden>
                        <DialogTitle>Visualizador de imágenes</DialogTitle>
                    </VisuallyHidden>
                    <VisuallyHidden>
                        <DialogDescription>
                            Visualiza y gestiona las imágenes del tratamiento
                        </DialogDescription>
                    </VisuallyHidden>
                    
                    <div 
                        ref={containerRef}
                        className="relative w-full h-full flex items-center justify-center bg-transparent overflow-hidden"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Imagen con zoom y drag limitado */}
                        <img
                            src={selectedImage ? getImageUrl(selectedImage.filePath) : ''}
                            alt={selectedImage?.title || selectedImage?.fileName}
                            className={cn(
                                "object-contain transition-transform duration-200 ease-out select-none",
                                isDragging && "cursor-grabbing",
                                zoomLevel > 1 && "cursor-grab"
                            )}
                            style={{
                                width: '100%',
                                height: '100%',
                                transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                            }}
                            draggable={false}
                        />

                        {/* Controles de zoom */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg p-1.5 shadow-lg z-20">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-700 hover:bg-gray-100"
                                onClick={handleZoomOut}
                                disabled={zoomLevel <= MIN_ZOOM}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-xs font-medium text-gray-700 min-w-[40px] text-center">
                                {Math.round(zoomLevel * 100)}%
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-700 hover:bg-gray-100"
                                onClick={handleZoomIn}
                                disabled={zoomLevel >= MAX_ZOOM}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            {zoomLevel > 1 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-700 hover:bg-gray-100"
                                    onClick={handleResetZoom}
                                >
                                    <RotateCw className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Botones Descargar y Eliminar */}
                        <div className="absolute bottom-6 right-6 flex gap-3 z-20">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-white/80 backdrop-blur-sm hover:bg-white"
                                onClick={() => window.open(getImageUrl(selectedImage?.filePath || ''), '_blank')}
                            >
                                <Download className="h-4 w-4" />
                                
                            </Button>
                        </div>

                        {/* Indicador de zoom */}
                        {zoomLevel > 1 && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-xs bg-black/50 px-3 py-1 rounded-full z-20">
                                {Math.round(zoomLevel * 100)}% • Arrastra para mover
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}