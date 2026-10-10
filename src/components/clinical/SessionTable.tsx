import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, CheckCircle2, Clock, UserX, Loader2, CalendarDays, FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { TreatmentSession } from '@/types/clinicalHistory';
import { SessionForm } from './SessionForm';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface SessionTableProps {
    data: TreatmentSession[];
    treatmentId: number;
    isLoading?: boolean;
    onComplete?: (session: TreatmentSession) => Promise<void> | void;
    onNoShow?: (session: TreatmentSession, reason?: string) => Promise<void> | void;
    onSessionUpdated?: () => void;
    actionsDisabled?: boolean;
    actionsDisabledReason?: string;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        onPageChange: (page: number) => void;
    };
}

type SessionState = 'COMPLETED' | 'NO_SHOW' | 'PENDING' | 'CANCELLED';
type ActionType = 'complete' | 'noShow';

const getSessionState = (session: TreatmentSession): SessionState => {
    if (session.status === 'COMPLETED' || session.completedAt) return 'COMPLETED';
    if (session.status === 'NO_SHOW') return 'NO_SHOW';
    if (session.status === 'CANCELLED') return 'CANCELLED';
    return 'PENDING';
};

const stateConfig: Record<SessionState, { label: string; className: string; icon: any }> = {
    COMPLETED: {
        label: 'Completada',
        className: 'bg-green-100 text-green-700 hover:bg-green-100',
        icon: CheckCircle2,
    },
    NO_SHOW: {
        label: 'No asistió',
        className: 'bg-red-100 text-red-700 hover:bg-red-100',
        icon: UserX,
    },
    PENDING: {
        label: 'Pendiente',
        className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
        icon: Clock,
    },
    CANCELLED: {
        label: 'Cancelada',
        className: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
        icon: Clock,
    },
};

const actionConfig: Record<ActionType, {
    title: string;
    question: (n: number) => string;
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
        title: 'Completar sesión',
        question: (n) => `¿Marcar la sesión #${n} como completada?`,
        note: 'La sesión quedará registrada como realizada.',
        icon: CheckCircle2,
        iconWrap: 'bg-green-100',
        iconColor: 'text-green-600',
        box: 'bg-green-50 border-green-200 text-green-700',
        button: 'bg-green-600 hover:bg-green-700',
        confirmLabel: 'Completar sesión',
        loadingLabel: 'Completando...',
    },
    noShow: {
        title: 'Registrar inasistencia',
        question: (n) => `¿Registrar que el paciente no asistió a la sesión #${n}?`,
        note: 'La sesión quedará marcada como "No asistió". El tratamiento seguirá activo.',
        icon: UserX,
        iconWrap: 'bg-red-100',
        iconColor: 'text-red-600',
        box: 'bg-red-50 border-red-200 text-red-700',
        button: 'bg-red-600 hover:bg-red-700',
        confirmLabel: 'Registrar inasistencia',
        loadingLabel: 'Registrando...',
        requiresReason: false,
        reasonLabel: 'Motivo (opcional)',
        reasonPlaceholder: 'Ej: El paciente avisó que no podía llegar',
    },
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const isoDate = dateString.split('T')[0];
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
};

/* ============================================================
   MOBILE / TABLET CARD
   ============================================================ */
interface SessionCardProps {
    session: TreatmentSession;
    actionsDisabled?: boolean;
    onView: (session: TreatmentSession) => void;
    onEdit?: (session: TreatmentSession) => void;
    onComplete?: (session: TreatmentSession) => void;
    onNoShow?: (session: TreatmentSession) => void;
}

function SessionCard({
    session,
    actionsDisabled,
    onView,
    onEdit,
    onComplete,
    onNoShow,
}: SessionCardProps) {
    const state = getSessionState(session);
    const cfg = stateConfig[state];
    const StateIcon = cfg.icon;
    const isPending = state === 'PENDING';
    const isNoShow = state === 'NO_SHOW';
    const hasProcedures = !!session.procedures;
    const hasNotes = session.notes && session.notes.trim().length > 0;

    return (
        <div
            onClick={() => onView(session)}
            className="bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-md active:scale-[0.99] cursor-pointer h-full flex flex-col"
        >
            {/* Header: descripción como título + estado */}
            <div className="flex items-start justify-between gap-2">
                <p
                    className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug flex-1 min-w-0"
                    title={session.description}
                >
                    {session.description || `Sesión ${session.sessionNumber}`}
                </p>
                <Badge
                    variant={state === 'PENDING' ? 'outline' : 'default'}
                    className={cn('shrink-0 text-[10px] px-2 py-0.5 whitespace-nowrap', cfg.className)}
                >
                    <StateIcon className="h-3 w-3 mr-1" />
                    {cfg.label}
                </Badge>
            </div>

            {/* Notas del no-show en rojo destacado */}
            {isNoShow && hasNotes && (
                <p
                    className="text-xs text-red-600 line-clamp-2 mt-2"
                    title={session.notes}
                >
                    {session.notes}
                </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-3 flex-1">
                <span className="font-medium text-gray-600">
                    Sesión #{session.sessionNumber}
                </span>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 text-gray-400 shrink-0" />
                    <span>{formatDate(session.sessionDate)}</span>
                </div>
                {hasProcedures && (
                    <Badge
                        variant="outline"
                        className="text-[10px] bg-blue-50 text-blue-600 border-blue-100 px-1.5 py-0"
                    >
                        Procedimientos
                    </Badge>
                )}
                {hasNotes && !isNoShow && (
                    <Badge
                        variant="outline"
                        className="text-[10px] bg-gray-50 text-gray-500 border-gray-200 px-1.5 py-0"
                    >
                        <FileText className="h-2.5 w-2.5 mr-0.5" />
                        Notas
                    </Badge>
                )}
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onView(session);
                    }}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-9 w-9"
                    title="Ver detalles"
                    aria-label="Ver detalles"
                >
                    <Eye className="h-4 w-4" />
                </Button>

                {!actionsDisabled && onEdit && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(session);
                        }}
                        className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 h-9 w-9"
                        title="Editar sesión"
                        aria-label="Editar sesión"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}

                {isPending && onComplete && !actionsDisabled && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onComplete(session);
                        }}
                        className="text-green-600 hover:text-green-800 hover:bg-green-50 h-9 w-9"
                        title="Marcar como completada"
                        aria-label="Marcar como completada"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                    </Button>
                )}

                {isPending && onNoShow && !actionsDisabled && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNoShow(session);
                        }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 h-9 w-9"
                        title="Marcar como no asistió"
                        aria-label="Marcar como no asistió"
                    >
                        <UserX className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export function SessionTable({
    data,
    treatmentId,
    isLoading,
    onComplete,
    onNoShow,
    onSessionUpdated,
    actionsDisabled = false,
    actionsDisabledReason,
    pagination,
}: SessionTableProps) {
    const useCardView = useMediaQuery('(max-width: 1024px)');

    const [selectedSession, setSelectedSession] = useState<TreatmentSession | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
    const [openNonce, setOpenNonce] = useState(0);

    const [pendingAction, setPendingAction] = useState<{ type: ActionType; session: TreatmentSession } | null>(null);
    const [isActing, setIsActing] = useState(false);
    const [noShowReason, setNoShowReason] = useState('');

    const openSession = (session: TreatmentSession, mode: 'view' | 'edit') => {
        setSelectedSession(session);
        setModalMode(mode);
        setOpenNonce((n) => n + 1);
        setModalOpen(true);
    };

    const closePendingAction = () => {
        if (isActing) return;
        setPendingAction(null);
        setNoShowReason('');
    };

    const confirmAction = async () => {
        if (!pendingAction) return;
        const { type, session } = pendingAction;

        setIsActing(true);
        try {
            if (type === 'complete') {
                await onComplete?.(session);
            } else {
                await onNoShow?.(session, noShowReason.trim() || undefined);
            }
            setPendingAction(null);
            setNoShowReason('');
        } catch {
            // El error ya se notificó en el handler de la página
        } finally {
            setIsActing(false);
        }
    };

    const pendingCfg = pendingAction ? actionConfig[pendingAction.type] : null;
    const PendingIcon = pendingCfg?.icon;
    const isReasonInvalid =
        !!pendingCfg?.requiresReason && pendingAction?.type === 'noShow' && noShowReason.trim().length < 3;

    /* Aviso de acciones deshabilitadas */
    const actionsDisabledBanner = actionsDisabled && actionsDisabledReason && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">{actionsDisabledReason}</p>
        </div>
    );

    /* COLUMNAS PARA DESKTOP */
    const columns: ColumnDef<TreatmentSession>[] = [
        {
            accessorKey: 'sessionNumber',
            header: 'Sesión',
            size: 80,
            cell: ({ row }) => (
                <div className="font-medium text-gray-900 text-center">
                    #{row.getValue('sessionNumber')}
                </div>
            ),
        },
        {
            accessorKey: 'sessionDate',
            header: 'Fecha',
            size: 100,
            cell: ({ row }) => {
                const date = row.getValue('sessionDate') as string;
                if (!date) return '-';
                return <div className="text-gray-600">{formatDate(date)}</div>;
            },
        },
        {
            accessorKey: 'description',
            header: 'Descripción',
            size: 350,
            cell: ({ row }) => {
                const session = row.original;
                const hasProcedures = !!session.procedures;
                const hasNotes = session.notes && session.notes.trim().length > 0;
                const isNoShow = getSessionState(session) === 'NO_SHOW';

                return (
                    <div className="max-w-md">
                        <div className="text-gray-700 truncate" title={session.description}>
                            {session.description}
                        </div>
                        {isNoShow && session.notes && (
                            <p className="text-xs text-red-600 mt-0.5 line-clamp-1" title={session.notes}>
                                {session.notes}
                            </p>
                        )}
                        {(hasProcedures || (hasNotes && !isNoShow)) && (
                            <div className="flex gap-1.5 mt-1">
                                {hasProcedures && (
                                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-100 px-1.5 py-0">
                                        Procedimientos
                                    </Badge>
                                )}
                                {hasNotes && !isNoShow && (
                                    <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500 border-gray-200 px-1.5 py-0">
                                        Notas
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'state',
            header: 'Estado',
            size: 120,
            cell: ({ row }) => {
                const state = getSessionState(row.original);
                const cfg = stateConfig[state];
                const StateIcon = cfg.icon;
                return (
                    <Badge variant={state === 'PENDING' ? 'outline' : 'default'} className={cfg.className}>
                        <StateIcon className="h-3 w-3 mr-1" />
                        {cfg.label}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 160,
            cell: ({ row }) => {
                const session = row.original;
                const state = getSessionState(session);
                const isPending = state === 'PENDING';

                return (
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                openSession(session, 'view');
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8"
                            title="Ver detalles"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>

                        {!actionsDisabled && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openSession(session, 'edit');
                                }}
                                className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 h-8 w-8"
                                title="Editar sesión"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}

                        {isPending && onComplete && !actionsDisabled && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingAction({ type: 'complete', session });
                                }}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 h-8 w-8"
                                title="Marcar como completada"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                            </Button>
                        )}

                        {isPending && onNoShow && !actionsDisabled && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingAction({ type: 'noShow', session });
                                }}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8"
                                title="Marcar como no asistió"
                            >
                                <UserX className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    /* LOADING STATE (mobile/tablet) */
    if (isLoading && useCardView) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                        <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                            </div>
                            <div className="h-5 bg-gray-200 rounded w-20" />
                        </div>
                        <div className="mt-3 space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-full" />
                            <div className="h-3 bg-gray-100 rounded w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    /* EMPTY STATE (mobile/tablet) */
    if (!data.length && !isLoading && useCardView) {
        return (
            <>
                {actionsDisabledBanner}
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                    <p className="text-sm text-gray-500">No hay sesiones registradas</p>
                </div>
            </>
        );
    }

    /* RENDER MOBILE/TABLET: cards */
    if (useCardView) {
        return (
            <>
                {actionsDisabledBanner}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.map((session) => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            actionsDisabled={actionsDisabled}
                            onView={(s) => openSession(s, 'view')}
                            onEdit={(s) => openSession(s, 'edit')}
                            onComplete={(s) => setPendingAction({ type: 'complete', session: s })}
                            onNoShow={(s) => setPendingAction({ type: 'noShow', session: s })}
                        />
                    ))}
                </div>

                {/* Paginación en mobile */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3 mt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                        >
                            Anterior
                        </Button>
                        <span className="text-xs text-gray-600">
                            {pagination.currentPage} / {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                )}

                {selectedSession && (
                    <SessionForm
                        key={`${selectedSession.id}-${modalMode}-${openNonce}`}
                        open={modalOpen}
                        onOpenChange={setModalOpen}
                        treatmentId={treatmentId}
                        sessionToEdit={selectedSession}
                        viewOnly={modalMode === 'view'}
                        onSuccess={() => {
                            setModalOpen(false);
                            onSessionUpdated?.();
                        }}
                    />
                )}

                {pendingAction && pendingCfg && PendingIcon && (
                    <Dialog
                        open
                        onOpenChange={(open) => {
                            if (!open) closePendingAction();
                        }}
                    >
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className={cn('p-2 rounded-full', pendingCfg.iconWrap)}>
                                        <PendingIcon className={cn('h-6 w-6', pendingCfg.iconColor)} />
                                    </div>
                                    <DialogTitle className="text-xl font-bold">{pendingCfg.title}</DialogTitle>
                                </div>
                                <DialogDescription className="pt-2">
                                    {pendingCfg.question(pendingAction.session.sessionNumber)}
                                </DialogDescription>
                            </DialogHeader>

                            <div className={cn('border rounded-lg p-3 text-sm', pendingCfg.box)}>
                                {pendingCfg.note}
                            </div>

                            {pendingAction.type === 'noShow' && (
                                <div className="space-y-2">
                                    <Label htmlFor="no-show-reason" className="text-sm font-medium text-gray-700">
                                        {pendingCfg.reasonLabel}
                                        {pendingCfg.requiresReason && <span className="text-red-500 ml-1">*</span>}
                                    </Label>
                                    <Textarea
                                        id="no-show-reason"
                                        value={noShowReason}
                                        onChange={(e) => setNoShowReason(e.target.value)}
                                        placeholder={pendingCfg.reasonPlaceholder}
                                        rows={3}
                                        className="w-full resize-none"
                                        disabled={isActing}
                                    />
                                    {pendingCfg.requiresReason && isReasonInvalid && noShowReason.length > 0 && (
                                        <p className="text-xs text-red-500">
                                            El motivo debe tener al menos 3 caracteres.
                                        </p>
                                    )}
                                </div>
                            )}

                            <DialogFooter className="gap-2">
                                <Button
                                    variant="outline"
                                    onClick={closePendingAction}
                                    disabled={isActing}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={confirmAction}
                                    disabled={isActing || isReasonInvalid}
                                    className={cn('gap-2 text-white', pendingCfg.button)}
                                >
                                    {isActing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {pendingCfg.loadingLabel}
                                        </>
                                    ) : (
                                        <>
                                            <PendingIcon className="h-4 w-4" />
                                            {pendingCfg.confirmLabel}
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </>
        );
    }

    /* RENDER DESKTOP: tabla */
    return (
        <>
            {actionsDisabledBanner}

            <DataTableShadcn
                columns={columns}
                data={data}
                isLoading={isLoading}
                onRowClick={(session) => openSession(session, 'view')}
                pagination={pagination}
            />

            {selectedSession && (
                <SessionForm
                    key={`${selectedSession.id}-${modalMode}-${openNonce}`}
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    treatmentId={treatmentId}
                    sessionToEdit={selectedSession}
                    viewOnly={modalMode === 'view'}
                    onSuccess={() => {
                        setModalOpen(false);
                        onSessionUpdated?.();
                    }}
                />
            )}

            {pendingAction && pendingCfg && PendingIcon && (
                <Dialog
                    open
                    onOpenChange={(open) => {
                        if (!open) closePendingAction();
                    }}
                >
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className={cn('p-2 rounded-full', pendingCfg.iconWrap)}>
                                    <PendingIcon className={cn('h-6 w-6', pendingCfg.iconColor)} />
                                </div>
                                <DialogTitle className="text-xl font-bold">{pendingCfg.title}</DialogTitle>
                            </div>
                            <DialogDescription className="pt-2">
                                {pendingCfg.question(pendingAction.session.sessionNumber)}
                            </DialogDescription>
                        </DialogHeader>

                        <div className={cn('border rounded-lg p-3 text-sm', pendingCfg.box)}>
                            {pendingCfg.note}
                        </div>

                        {pendingAction.type === 'noShow' && (
                            <div className="space-y-2">
                                <Label htmlFor="no-show-reason" className="text-sm font-medium text-gray-700">
                                    {pendingCfg.reasonLabel}
                                    {pendingCfg.requiresReason && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                <Textarea
                                    id="no-show-reason"
                                    value={noShowReason}
                                    onChange={(e) => setNoShowReason(e.target.value)}
                                    placeholder={pendingCfg.reasonPlaceholder}
                                    rows={3}
                                    className="w-full resize-none"
                                    disabled={isActing}
                                />
                                {pendingCfg.requiresReason && isReasonInvalid && noShowReason.length > 0 && (
                                    <p className="text-xs text-red-500">
                                        El motivo debe tener al menos 3 caracteres.
                                    </p>
                                )}
                            </div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={closePendingAction}
                                disabled={isActing}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={confirmAction}
                                disabled={isActing || isReasonInvalid}
                                className={cn('gap-2 text-white', pendingCfg.button)}
                            >
                                {isActing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {pendingCfg.loadingLabel}
                                    </>
                                ) : (
                                    <>
                                        <PendingIcon className="h-4 w-4" />
                                        {pendingCfg.confirmLabel}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}