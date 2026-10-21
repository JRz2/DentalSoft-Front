import { useState, useEffect } from 'react';
import { CheckCircle2, UserX, XCircle, Loader2 } from 'lucide-react';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type AppointmentActionType = 'complete' | 'noShow' | 'cancel';

const actionConfig: Record<AppointmentActionType, {
    title: string;
    question: (date: string) => string;
    note: string;
    icon: any;
    iconWrap: string;
    iconColor: string;
    box: string;
    button: string;
    confirmLabel: string;
    loadingLabel: string;
    requiresReason?: boolean;
    reasonLabel?: string;
    reasonPlaceholder?: string;
}> = {
    complete: {
        title: 'Completar cita',
        question: (date) => `¿Marcar la cita del ${date} como completada?`,
        note: 'La cita quedará registrada como realizada.',
        icon: CheckCircle2,
        iconWrap: 'bg-green-100',
        iconColor: 'text-green-600',
        box: 'bg-green-50 border-green-200 text-green-700',
        button: 'bg-green-600 hover:bg-green-700',
        confirmLabel: 'Completar cita',
        loadingLabel: 'Completando...',
    },
    noShow: {
        title: 'Registrar inasistencia',
        question: (date) => `¿Registrar que el paciente no asistió a la cita del ${date}?`,
        note: 'La cita quedará marcada como "No asistió".',
        icon: UserX,
        iconWrap: 'bg-orange-100',
        iconColor: 'text-orange-600',
        box: 'bg-orange-50 border-orange-200 text-orange-700',
        button: 'bg-orange-600 hover:bg-orange-700',
        confirmLabel: 'Registrar inasistencia',
        loadingLabel: 'Registrando...',
        requiresReason: false,
        reasonLabel: 'Motivo (opcional)',
        reasonPlaceholder: 'Ej: El paciente avisó que no podía llegar',
    },
    cancel: {
        title: 'Cancelar cita',
        question: (date) => `¿Cancelar la cita del ${date}?`,
        note: 'Esta acción no se puede deshacer. La cita quedará como cancelada.',
        icon: XCircle,
        iconWrap: 'bg-red-100',
        iconColor: 'text-red-600',
        box: 'bg-red-50 border-red-200 text-red-700',
        button: 'bg-red-600 hover:bg-red-700',
        confirmLabel: 'Cancelar cita',
        loadingLabel: 'Cancelando...',
        requiresReason: true,
        reasonLabel: 'Motivo de la cancelación',
        reasonPlaceholder: 'Ej: El paciente solicitó reprogramar',
    },
};

interface AppointmentStatusConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    action: AppointmentActionType | null;
    appointmentDate?: string;
    onConfirm: (reason?: string) => Promise<void> | void;
    isLoading?: boolean;
}

export function AppointmentStatusConfirmDialog({
    open,
    onOpenChange,
    action,
    appointmentDate = '',
    onConfirm,
    isLoading = false,
}: AppointmentStatusConfirmDialogProps) {
    const [reason, setReason] = useState('');

    // Limpiar el motivo cuando se cierra o cambia la acción
    useEffect(() => {
        if (!open) setReason('');
    }, [open, action]);

    if (!action) return null;

    const cfg = actionConfig[action];
    const Icon = cfg.icon;

    const isReasonInvalid =
        !!cfg.requiresReason &&
        action === 'cancel' &&
        reason.trim().length > 0 &&
        reason.trim().length < 3;

    const handleConfirm = async () => {
        if (isReasonInvalid) return;
        await onConfirm(reason.trim() || undefined);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isLoading && !isOpen) onOpenChange(false);
            }}
        >
            <DialogContent
                className={cn(
                    'w-[calc(100vw-2rem)] max-w-md max-h-[90vh]',
                    'overflow-y-auto overflow-x-hidden',
                    'p-4 sm:p-6',
                    '[&>*]:min-w-0'
                )}
            >
                <DialogHeader className="min-w-0">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                        <div className={cn('p-2 rounded-full shrink-0', cfg.iconWrap)}>
                            <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', cfg.iconColor)} />
                        </div>
                        <DialogTitle className="text-base sm:text-xl font-bold leading-tight min-w-0 break-words">
                            {cfg.title}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="pt-2 text-xs sm:text-sm break-words">
                        {cfg.question(appointmentDate)}
                    </DialogDescription>
                </DialogHeader>

                <div className={cn('border rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm break-words', cfg.box)}>
                    {cfg.note}
                </div>

                {(action === 'noShow' || action === 'cancel') && (
                    <div className="space-y-2 min-w-0">
                        <Label
                            htmlFor="action-reason"
                            className="text-xs sm:text-sm font-medium text-gray-700"
                        >
                            {cfg.reasonLabel}
                            {cfg.requiresReason && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Textarea
                            id="action-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={cfg.reasonPlaceholder}
                            rows={3}
                            className="w-full resize-none text-sm"
                            disabled={isLoading}
                        />
                        {isReasonInvalid && (
                            <p className="text-xs text-red-500">
                                El motivo debe tener al menos 3 caracteres.
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter className="!flex-row justify-end gap-2 !space-x-0 pt-2 min-w-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="flex-1 sm:flex-initial min-w-0"
                    >
                        <span className="truncate min-w-0">Volver</span>
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || isReasonInvalid || (cfg.requiresReason && !reason.trim())}
                        className={cn(
                            'text-white flex-1 sm:flex-initial min-w-0 gap-2',
                            cfg.button
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                <span className="truncate min-w-0">{cfg.loadingLabel}</span>
                            </>
                        ) : (
                            <>
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="truncate min-w-0">{cfg.confirmLabel}</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}