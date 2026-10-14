import { useState, useEffect, useRef } from 'react';
import { format, isToday, getDay } from 'date-fns';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export interface StatusConfig {
    bg: string;
    label: string;
}

export interface FilterOption {
    value: string;
    label: string;
}

type AccentColor = 'emerald' | 'blue' | 'purple' | 'amber' | 'red';

const ACCENT_MAP: Record<AccentColor, { dayName: string; number: string; dot: string; stat: string }> = {
    emerald: {
        dayName: 'text-emerald-600',
        number: 'text-emerald-400',
        dot: 'bg-emerald-500',
        stat: 'text-emerald-600',
    },
    blue: {
        dayName: 'text-blue-600',
        number: 'text-blue-400',
        dot: 'bg-blue-500',
        stat: 'text-blue-600',
    },
    purple: {
        dayName: 'text-purple-600',
        number: 'text-purple-400',
        dot: 'bg-purple-500',
        stat: 'text-purple-600',
    },
    amber: {
        dayName: 'text-amber-600',
        number: 'text-amber-400',
        dot: 'bg-amber-500',
        stat: 'text-amber-600',
    },
    red: {
        dayName: 'text-red-600',
        number: 'text-red-400',
        dot: 'bg-red-500',
        stat: 'text-red-600',
    },
};

interface StackedBarChartProps {
    weekDays: Date[];
    getDayData: (day: Date) => {
        total: number;
        statuses: Record<string, number | undefined>;
    };
    maxValue: number;
    statusOrder: string[];
    statusConfig: Record<string, StatusConfig>;
    statusBreakdown?: { status: string; count: number }[];
    emptyTooltipLabel: string;
    tooltipSingular: string;
    tooltipPlural: string;
    accentColor: AccentColor;
    filterValue: string;
    onFilterChange: (value: string) => void;
    filterOptions: FilterOption[];
    title: string;
    subtitle: string;
    totalLabel: string;
    isMobile: boolean;
    isTablet: boolean;
}

export function StackedBarChart({
    weekDays,
    getDayData,
    maxValue,
    statusOrder,
    statusConfig,
    statusBreakdown,
    emptyTooltipLabel,
    tooltipSingular,
    tooltipPlural,
    accentColor,
    filterValue,
    onFilterChange,
    filterOptions,
    title,
    subtitle,
    totalLabel,
    isMobile,
    isTablet,
}: StackedBarChartProps) {
    // Un solo tooltip abierto a la vez
    const [openTooltip, setOpenTooltip] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const accent = ACCENT_MAP[accentColor];

    // Cerrar tooltip al hacer click fuera
    useEffect(() => {
        if (openTooltip === null) return;

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpenTooltip(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [openTooltip]);

    // Calcular altura de barra según breakpoint
    const getBarHeight = (baseHeight: number) => {
        if (isMobile) return Math.max(baseHeight * 0.5, 10);
        if (isTablet) return Math.max(baseHeight * 0.7, 12);
        return Math.max(baseHeight, 16);
    };

    // Total y promedio
    const total = weekDays.reduce((sum, day) => sum + getDayData(day).total, 0);
    const avg = weekDays.length > 0 ? Math.round((total / weekDays.length) * 10) / 10 : 0;
    const maxDay = Math.max(...weekDays.map((d) => getDayData(d).total), 0);

    // Hoy (índice en array Monday-first)
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const todayValue = weekDays[todayIndex] ? getDayData(weekDays[todayIndex]).total : 0;

    return (
        <div
            ref={containerRef}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6"
        >
            {/* Header con filtro */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                        value={filterValue}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="text-xs md:text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        {filterOptions.map((filter) => (
                            <option key={filter.value} value={filter.value}>
                                {filter.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Chart */}
            <div className="flex items-end justify-between h-40 sm:h-52 md:h-64 gap-1 sm:gap-2">
                {weekDays.map((day, index) => {
                    const dayData = getDayData(day);
                    const dayTotal = dayData.total;
                    const barHeight = maxValue > 0 ? (dayTotal / maxValue) * 200 : 0;
                    const isTodayDate = isToday(day);
                    const dayOfWeek = getDay(day);
                    const isSunday = dayOfWeek === 0;
                    const isSaturday = dayOfWeek === 6;
                    const barHeightPx = getBarHeight(barHeight);

                    const segments = statusOrder
                        .map((status) => ({
                            status,
                            count: dayData.statuses?.[status] || 0,
                            config: statusConfig[status],
                        }))
                        .filter((seg) => seg.count > 0);

                    const hasData = dayTotal > 0;
                    const isTooltipOpen = openTooltip === index;

                    // Posicionamiento del tooltip
                    const isLeftEdge = index === 0;
                    const isRightEdge = index === weekDays.length - 1;

                    return (
                        <div
                            key={index}
                            className="flex-1 flex flex-col items-center gap-1 sm:gap-2"
                        >
                            <span
                                className={cn(
                                    'text-[10px] sm:text-xs font-semibold mb-0.5 sm:mb-1',
                                    hasData ? 'text-gray-600' : 'text-gray-300'
                                )}
                            >
                                {dayTotal}
                            </span>

                            {/* Wrapper sin overflow-hidden para que el tooltip no se corte */}
                            <div
                                className="w-full relative"
                                style={{ height: `${barHeightPx}px`, minHeight: '8px' }}
                            >
                                {/* Botón/barra con overflow-hidden para el radius */}
                                <button
                                    type="button"
                                    onClick={() => setOpenTooltip(isTooltipOpen ? null : index)}
                                    onMouseEnter={() => !isMobile && setOpenTooltip(index)}
                                    onMouseLeave={() => !isMobile && setOpenTooltip(null)}
                                    aria-label={`Ver detalle del día ${format(day, 'd')}`}
                                    className={cn(
                                        'w-full h-full rounded-lg overflow-hidden transition-all duration-300 cursor-pointer',
                                        isTooltipOpen && 'ring-2 ring-offset-1 ring-primary-300 scale-105'
                                    )}
                                >
                                    {hasData ? (
                                        <div className="flex flex-col h-full w-full">
                                            {segments.map((segment, segIndex) => {
                                                const segmentHeight =
                                                    dayTotal > 0 ? (segment.count / dayTotal) * 100 : 0;
                                                return (
                                                    <div
                                                        key={segment.status}
                                                        className={cn(
                                                            'w-full transition-all duration-500',
                                                            segment.config.bg
                                                        )}
                                                        style={{
                                                            height: `${segmentHeight}%`,
                                                            borderTopLeftRadius: segIndex === 0 ? '0.5rem' : '0',
                                                            borderTopRightRadius: segIndex === 0 ? '0.5rem' : '0',
                                                            borderBottomLeftRadius:
                                                                segIndex === segments.length - 1 ? '0.5rem' : '0',
                                                            borderBottomRightRadius:
                                                                segIndex === segments.length - 1 ? '0.5rem' : '0',
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full border-2 border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center">
                                            <span className="text-[10px] text-gray-300">—</span>
                                        </div>
                                    )}
                                </button>

                                {/* Tooltip — fuera del overflow-hidden */}
                                {isTooltipOpen && (
                                    <div
                                        className={cn(
                                            'absolute -top-2 -translate-y-full z-30',
                                            'bg-gray-800 text-white text-[10px] sm:text-xs px-2.5 py-2 rounded-lg',
                                            'shadow-lg pointer-events-none',
                                            isLeftEdge
                                                ? 'left-0'
                                                : isRightEdge
                                                    ? 'right-0'
                                                    : 'left-1/2 -translate-x-1/2'
                                        )}
                                    >
                                        <div className="font-semibold mb-1">
                                            {DAY_NAMES_SHORT[index]} {format(day, 'd')}
                                        </div>
                                        {hasData ? (
                                            <>
                                                <div className="text-[10px] text-gray-300 mb-1">
                                                    Total: {dayTotal}{' '}
                                                    {dayTotal === 1 ? tooltipSingular : tooltipPlural}
                                                </div>
                                                <div className="space-y-0.5">
                                                    {segments.map((segment) => (
                                                        <div
                                                            key={segment.status}
                                                            className="flex items-center gap-1.5"
                                                        >
                                                            <div
                                                                className={cn(
                                                                    'w-2 h-2 rounded-full',
                                                                    segment.config.bg
                                                                )}
                                                            />
                                                            <span className="text-[10px]">
                                                                {segment.config.label}: {segment.count}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-[10px] text-gray-300">
                                                {emptyTooltipLabel}
                                            </div>
                                        )}
                                        {/* Flecha solo cuando está centrado */}
                                        {!isLeftEdge && !isRightEdge && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800" />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Etiquetas del día */}
                            <span
                                className={cn(
                                    'text-[10px] sm:text-xs font-medium',
                                    isTodayDate
                                        ? cn('font-bold', accent.dayName)
                                        : isSunday
                                            ? 'text-red-500 font-bold'
                                            : isSaturday
                                                ? 'text-purple-500'
                                                : 'text-gray-500'
                                )}
                            >
                                {DAY_NAMES_SHORT[index]}
                            </span>
                            <span
                                className={cn(
                                    'text-[10px]',
                                    isTodayDate
                                        ? accent.number
                                        : isSunday
                                            ? 'text-red-400'
                                            : 'text-gray-400'
                                )}
                            >
                                {format(day, 'd')}
                            </span>

                            {isTodayDate && (
                                <div
                                    className={cn(
                                        'w-1 h-1 rounded-full animate-pulse mt-0.5',
                                        accent.dot
                                    )}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Stats inferiores */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-gray-900">{total}</p>
                    <p className="text-[10px] text-gray-500">{totalLabel}</p>
                </div>
                <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-green-600">{maxDay}</p>
                    <p className="text-[10px] text-gray-500">Pico máximo</p>
                </div>
                <div className="text-center">
                    <p className={cn('text-base sm:text-lg font-bold', accent.stat)}>
                        {todayValue}
                    </p>
                    <p className="text-[10px] text-gray-500">Hoy</p>
                </div>
                <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-yellow-600">{avg}</p>
                    <p className="text-[10px] text-gray-500">Promedio/día</p>
                </div>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Leyenda:</span>
                {Object.entries(statusConfig).map(([status, config]) => {
                    const count =
                        statusBreakdown?.find((item) => item.status === status)?.count || 0;
                    return (
                        <div key={status} className="flex items-center gap-1.5">
                            <div className={cn('w-3 h-3 rounded', config.bg)} />
                            <span className="text-xs text-gray-600">
                                {config.label}
                                {count > 0 && ` (${count})`}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}