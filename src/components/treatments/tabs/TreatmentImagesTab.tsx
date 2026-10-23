import { Plus, Image as ImageIcon, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageCarousel } from '@/components/treatments/ImageGallery';
import { Treatment } from '@/types/clinicalHistory';

interface TreatmentImagesTabProps {
    treatment: Treatment;
    images: any[]; 
    isLoading: boolean;
    onOpenUploadModal: () => void;
    onDeleteImage: (id: number) => Promise<any>;
    imagesDisabled: boolean;
    imagesDisabledReason?: string;
}

export function TreatmentImagesTab({
    treatment,
    images,
    isLoading,
    onOpenUploadModal,
    onDeleteImage,
    imagesDisabled,
    imagesDisabledReason,
}: TreatmentImagesTabProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {/* Sticky header: título + botón */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 md:px-6 py-2.5 md:py-4 rounded-t-2xl">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                    <div className="min-w-0">
                        <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-primary-600 shrink-0" />
                            Galería de Imágenes
                        </h2>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                            {images?.length || 0}{' '}
                            {(images?.length || 0) === 1 ? 'imagen registrada' : 'imágenes registradas'}
                            {treatment?.name && (
                                <span className="hidden lg:inline"> · {treatment.name}</span>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-col items-stretch sm:items-end gap-1.5">
                        <Button
                            onClick={onOpenUploadModal}
                            disabled={imagesDisabled}
                            size="sm"
                            className="gap-2 rounded-lg w-full sm:w-auto hidden sm:flex"
                            title={imagesDisabledReason}
                        >
                            <Plus className="h-4 w-4" />
                            Nueva Imagen
                        </Button>
                        {imagesDisabledReason && (
                            <span className="text-xs text-gray-500 flex items-center gap-1 sm:justify-end">
                                <Lock className="h-3 w-3 shrink-0" />
                                {imagesDisabledReason}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-3 md:p-6 rounded-b-2xl">
                <ImageCarousel
                    images={images || []}
                    isLoading={isLoading}
                    treatmentName={treatment.name}
                    onUpload={onOpenUploadModal}
                    onDelete={onDeleteImage}
                    disabled={imagesDisabled}
                    disabledReason={imagesDisabledReason}
                    hideHeader
                />
            </div>
        </div>
    );
}