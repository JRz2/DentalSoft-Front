import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle, CalendarX, UserX, ChevronRight, CheckCircle2,
    PlayCircle, XCircle, AlertCircle, DollarSign, ClipboardList, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardAlert, AlertSeverity, AlertType } from '@/types/dashboard';

interface AttentionPanelProps {
    alerts: DashboardAlert[];
}

type AlertColor = 'red' | 'amber' | 'blue' | 'emerald' | 'gray';

const SEVERITY_TO_COLOR: Record<AlertSeverity, AlertColor> = {
    critical: 'red',
    warning: 'amber',
    info: 'blue',
    success: 'emerald',
};

const COLOR_MAP: Record<
    AlertColor,
    {
        bg: string;
        border: string;
        icon: string;
        iconBg: string;
        text: string;
        hover: string;
    }
> = {
    red: {
        bg: 'bg-red-50/70',
        border: 'border-red-200',
        icon: 'text-red-600',
        iconBg: 'bg-red-100',
        text: 'text-red-900',
        hover: 'hover:bg-red-50 hover:border-red-300',
    },
    amber: {
        bg: 'bg-amber-50/70',
        border: 'border-amber-200',
        icon: 'text-amber-600',
        iconBg: 'bg-amber-100',
        text: 'text-amber-900',
        hover: 'hover:bg-amber-50 hover:border-amber-300',
    },
    blue: {
        bg: 'bg-blue-50/70',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        iconBg: 'bg-blue-100',
        text: 'text-blue-900',
        hover: 'hover:bg-blue-50 hover:border-blue-300',
    },
    emerald: {
        bg: 'bg-emerald-50/70',
        border: 'border-emerald-200',
        icon: 'text-emerald-600',
        iconBg: 'bg-emerald-100',
        text: 'text-emerald-900',
        hover: 'hover:bg-emerald-50 hover:border-emerald-300',
    },
    gray: {
        bg: 'bg-gray-50/70',
        border: 'border-gray-200',
        icon: 'text-gray-600',
        iconBg: 'bg-gray-100',
        text: 'text-gray-900',
        hover: 'hover:bg-gray-50 hover:border-gray-300',
    },
};

const ALERT_ICON: Record<AlertType, any> = {
    UNCONFIRMED_APPOINTMENTS: CalendarX,
    NO_SHOW: UserX,
    IN_PROGRESS: PlayCircle,
    CANCELLED: XCircle,
    PENDING_TREATMENTS: ClipboardList,
    PENDING_PAYMENTS: DollarSign,
};

export function AttentionPanel({ alerts }: AttentionPanelProps) {
    const navigate = useNavigate();

    const totalAlerts = alerts.length;

    /* ---------- Estado vacío ---------- */
    if (totalAlerts === 0) {
        return (
            <div className="relative bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-white to-white pointer-events-none" />
                <div className="relative p-4 md:p-5 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">
                            Todo al día
                        </h3>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                        <div className="relative mb-3">
                            <div className="absolute inset-0 bg-emerald-200 rounded-full blur-xl opacity-50" />
                            <div className="relative p-3 bg-emerald-50 rounded-full ring-4 ring-emerald-100/50">
                                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                            </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">
                            Nada requiere tu atención
                        </p>
                        <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                            Todo está al día. ¡Buen trabajo!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    /* ---------- Panel con TODAS las alertas ---------- */
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-2 bg-amber-100 rounded-xl shrink-0">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                        Requiere tu atención
                    </h3>
                </div>
                <span
                    className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0"
                    aria-label={`${totalAlerts} alertas`}
                >
                    {totalAlerts}
                </span>
            </div>

            <div className="space-y-2">
                {alerts.map((alert) => {
                    const Icon = ALERT_ICON[alert.type] || AlertCircle;
                    const color = SEVERITY_TO_COLOR[alert.severity];
                    const c = COLOR_MAP[color];
                    const samples = alert.metadata?.sampleNames;
                    const hasSamples = samples && samples.length > 0;

                    return (
                        <button
                            key={alert.type}
                            type="button"
                            onClick={() => navigate(alert.href)}
                            aria-label={`${alert.label}. ${alert.description}`}
                            className={cn(
                                'group/alert w-full text-left rounded-xl border p-3',
                                'transition-all duration-200',
                                'hover:scale-[1.01] hover:shadow-sm active:scale-[0.995]',
                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary-400',
                                c.bg,
                                c.border,
                                c.hover,
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        'p-2 rounded-lg shrink-0 transition-transform group-hover/alert:scale-110',
                                        c.iconBg,
                                    )}
                                >
                                    <Icon className={cn('h-4 w-4', c.icon)} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className={cn('text-sm font-semibold', c.text)}>
                                        {alert.label}
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        {alert.description}
                                    </p>

                                    {hasSamples && (
                                        <p className="text-[10px] text-gray-400 mt-1 truncate italic">
                                            {samples.slice(0, 3).join(' · ')}
                                            {alert.count > 3 && ` +${alert.count - 3}`}
                                        </p>
                                    )}
                                </div>

                                <ChevronRight
                                    className={cn(
                                        'h-4 w-4 shrink-0 transition-transform group-hover/alert:translate-x-0.5',
                                        c.icon,
                                    )}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}