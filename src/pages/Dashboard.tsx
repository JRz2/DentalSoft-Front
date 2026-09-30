import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import { format, startOfWeek, addDays, isSameDay, isToday, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, CalendarDays, Loader2, Filter, Users, CalendarClock, ClipboardList, DollarSign } from 'lucide-react';
import doctor from '@/assets/images/doctor.png';

const getInitials = (name?: string) => {
  if (!name || !name.trim()) return '?';
  return name
    .trim()
    .split(' ')
    .map(word => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const getImageUrl = (path: string | null) => {
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

// Filtros para CITAS (3 estados)
const STATUS_FILTERS = [
  { value: 'all', label: 'Todos', color: 'text-gray-600' },
  { value: 'SCHEDULED', label: 'Agendadas', color: 'text-blue-600' },
  { value: 'CONFIRMED', label: 'Confirmadas', color: 'text-green-600' },
  { value: 'COMPLETED', label: 'Completadas', color: 'text-purple-600' },
];

// Filtros para TRATAMIENTOS (4 estados)
const TREATMENT_STATUS_FILTERS = [
  { value: 'all', label: 'Todos', color: 'text-gray-600' },
  { value: 'PLANNED', label: 'Planificados', color: 'text-amber-600' },
  { value: 'IN_PROGRESS', label: 'En Progreso', color: 'text-blue-600' },
  { value: 'COMPLETED', label: 'Completados', color: 'text-emerald-600' },
  { value: 'CANCELLED', label: 'Cancelados', color: 'text-red-600' },
];

// Colores y etiquetas por estado de tratamiento
const TREATMENT_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PLANNED: { color: 'bg-amber-500', bg: 'bg-amber-500', label: 'Planificados' },
  IN_PROGRESS: { color: 'bg-blue-500', bg: 'bg-blue-500', label: 'En Progreso' },
  COMPLETED: { color: 'bg-emerald-500', bg: 'bg-emerald-500', label: 'Completados' },
  CANCELLED: { color: 'bg-red-500', bg: 'bg-red-500', label: 'Cancelados' },
};

// Colores y etiquetas por estado de CITA (3 estados)
const APPOINTMENT_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  SCHEDULED: { color: 'bg-blue-500', bg: 'bg-blue-500', label: 'Agendadas' },
  CONFIRMED: { color: 'bg-green-500', bg: 'bg-green-500', label: 'Confirmadas' },
  COMPLETED: { color: 'bg-purple-500', bg: 'bg-purple-500', label: 'Completadas' },
};

//  Orden de apilamiento (de abajo hacia arriba)
const TREATMENT_STATUS_ORDER = ['COMPLETED', 'IN_PROGRESS', 'PLANNED', 'CANCELLED'];
const APPOINTMENT_STATUS_ORDER = ['COMPLETED', 'CONFIRMED', 'SCHEDULED'];

export const Dashboard = () => {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useDashboard();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTreatmentStatus, setSelectedTreatmentStatus] = useState<string>('all');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error al cargar los datos: {error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const {
    statistics = { totalPatients: 0, pendingAppointments: 0, activeTreatments: 0, monthlyIncome: 0 },
    weeklyActivity = { weekStart: '', weekEnd: '', total: 0, statusBreakdown: [], days: [] },
    weeklyTreatments = { weekStart: '', weekEnd: '', total: 0, statusBreakdown: [], days: [] },
    weekAppointments = [],
    monthlyData = { year: 0, month: 0, daysWithAppointments: [], totalAppointments: 0 }
  } = data || {};

  const appointments = Array.isArray(weekAppointments) ? weekAppointments : [];
  const activityDays = Array.isArray(weeklyActivity.days) ? weeklyActivity.days : [];
  const treatmentDays = Array.isArray(weeklyTreatments.days) ? weeklyTreatments.days : [];

  // ============ DATOS PARA GRÁFICO DE CITAS ============
  const getAppointmentDayData = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayData = activityDays.find(d => d.date === dateStr);

    if (!dayData) {
      return { total: 0, statuses: {} as Record<string, number> };
    }

    if (selectedStatus !== 'all') {
      const count = dayData.statuses?.[selectedStatus] || 0;
      return {
        total: count,
        statuses: count > 0 ? { [selectedStatus]: count } : {}
      };
    }

    return {
      total: dayData.total || 0,
      statuses: dayData.statuses || {}
    };
  };

  const appointmentData = weekDays.map(day => {
    const dayData = getAppointmentDayData(day);
    return dayData.total;
  });

  const maxAppointments = Math.max(...appointmentData, 0);
  const totalAppointments = appointmentData.reduce((a, b) => a + b, 0);
  const maxAppointmentDay = Math.max(...appointmentData, 0);
  const avgAppointments = appointmentData.length > 0 ? Math.round((totalAppointments / appointmentData.length) * 10) / 10 : 0;

  // ============ DATOS PARA GRÁFICO DE TRATAMIENTOS ============
  const getTreatmentDayData = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayData = treatmentDays.find(d => d.date === dateStr);

    if (!dayData) {
      return { total: 0, statuses: {} as Record<string, number> };
    }

    if (selectedTreatmentStatus !== 'all') {
      const count = dayData.statuses?.[selectedTreatmentStatus] || 0;
      return {
        total: count,
        statuses: count > 0 ? { [selectedTreatmentStatus]: count } : {}
      };
    }

    return {
      total: dayData.total || 0,
      statuses: dayData.statuses || {}
    };
  };

  const treatmentData = weekDays.map(day => {
    const dayData = getTreatmentDayData(day);
    return dayData.total;
  });

  const maxTreatments = Math.max(...treatmentData, 0);
  const totalTreatments = treatmentData.reduce((a, b) => a + b, 0);
  const maxTreatmentDay = Math.max(...treatmentData, 0);
  const avgTreatments = treatmentData.length > 0 ? Math.round((totalTreatments / treatmentData.length) * 10) / 10 : 0;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none';
    const parent = e.currentTarget.parentElement;
    const fallback = parent?.querySelector('.fallback-avatar');
    if (fallback) {
      fallback.classList.remove('hidden');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* HEADER - Bienvenida */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <img
            src={doctor}
            alt="doctor"
            className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Bienvenido, <span className="text-primary-600">{user?.name || 'Doctor'}</span> 👋
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">
              {format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-500 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl shadow-sm border border-gray-100">
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-primary-500" />
            <span className="font-mono font-medium text-gray-700">
              {currentTime.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
            <span className="w-px h-4 bg-gray-200 hidden sm:block" />
            <span className="hidden sm:block">{currentTime.toLocaleDateString('es-ES', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}</span>
          </div>
        </div>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS — íconos en vez de ilustraciones 3D */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div>
            <p className="text-xs md:text-sm font-medium text-gray-500">Total Pacientes</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">
              {statistics.totalPatients}
            </p>
          </div>
          <div className="absolute bottom-0 right-0 p-2 md:p-3">
            <Users className="w-8 h-8 md:w-12 md:h-12 text-gray-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div>
            <p className="text-xs md:text-sm font-medium text-gray-500">Citas Pendientes</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">
              {statistics.pendingAppointments}
            </p>
          </div>
          <div className="absolute bottom-0 right-0 p-2 md:p-3">
            <CalendarClock className="w-8 h-8 md:w-12 md:h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div>
            <p className="text-xs md:text-sm font-medium text-gray-500">Tratamientos Activos</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">
              {statistics.activeTreatments}
            </p>
          </div>
          <div className="absolute bottom-0 right-0 p-2 md:p-3">
            <ClipboardList className="w-8 h-8 md:w-12 md:h-12 text-emerald-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div>
            <p className="text-xs md:text-sm font-medium text-gray-500">Ingresos del Mes</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">
              ${statistics.monthlyIncome.toLocaleString()}
            </p>
          </div>
          <div className="absolute bottom-0 right-0 p-2 md:p-3">
            <DollarSign className="w-8 h-8 md:w-12 md:h-12 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* GRID: GRÁFICOS (IZQUIERDA) + CALENDARIO + CITAS (DERECHA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* COLUMNA IZQUIERDA: GRÁFICOS (2 columnas) */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* GRÁFICO 1: NUEVOS TRATAMIENTOS (STACKED BAR CHART) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Nuevos Tratamientos en la Semana</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tratamientos creados por día</p>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedTreatmentStatus}
                  onChange={(e) => setSelectedTreatmentStatus(e.target.value)}
                  className="text-xs md:text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {TREATMENT_STATUS_FILTERS.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stacked Bar Chart */}
            <div className="flex items-end justify-between h-40 sm:h-52 md:h-64 gap-1 sm:gap-2">
              {weekDays.map((day, index) => {
                const dayData = getTreatmentDayData(day);
                const total = dayData.total;
                const barHeight = maxTreatments > 0 ? (total / maxTreatments) * 200 : 0;
                const isTodayDate = isToday(day);
                const dayOfWeek = getDay(day);
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;
                const dayNamesShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

                const getBarHeight = () => {
                  if (window.innerWidth < 640) return Math.max(barHeight * 0.5, 10);
                  if (window.innerWidth < 1024) return Math.max(barHeight * 0.7, 12);
                  return Math.max(barHeight, 16);
                };

                const segments = TREATMENT_STATUS_ORDER
                  .map(status => ({
                    status,
                    count: dayData.statuses?.[status] || 0,
                    config: TREATMENT_STATUS_CONFIG[status]
                  }))
                  .filter(seg => seg.count > 0);

                const barHeightPx = getBarHeight();
                const hasData = total > 0;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                    <span className={`text-[10px] sm:text-xs font-semibold ${hasData ? 'text-gray-600' : 'text-gray-300'} mb-0.5 sm:mb-1`}>
                      {total}
                    </span>

                    {/* Barra apilada con placeholder */}
                    <div
                      className="w-full rounded-lg transition-all duration-700 hover:scale-105 cursor-pointer relative group overflow-hidden"
                      style={{ height: `${barHeightPx}px`, minHeight: '8px' }}
                    >
                      {hasData ? (
                        <div className="flex flex-col h-full w-full">
                          {segments.map((segment, segIndex) => {
                            const segmentHeight = total > 0 ? (segment.count / total) * 100 : 0;
                            return (
                              <div
                                key={segment.status}
                                className={`w-full ${segment.config.bg} transition-all duration-500`}
                                style={{
                                  height: `${segmentHeight}%`,
                                  borderTopLeftRadius: segIndex === 0 ? '0.5rem' : '0',
                                  borderTopRightRadius: segIndex === 0 ? '0.5rem' : '0',
                                  borderBottomLeftRadius: segIndex === segments.length - 1 ? '0.5rem' : '0',
                                  borderBottomRightRadius: segIndex === segments.length - 1 ? '0.5rem' : '0',
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

                      {/* Tooltip enriquecido */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-gray-800 text-white text-[10px] sm:text-xs px-2.5 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg">
                        <div className="font-semibold mb-1">
                          {dayNamesShort[index]} {format(day, 'd')}
                        </div>
                        {hasData ? (
                          <>
                            <div className="text-[9px] sm:text-[10px] text-gray-300 mb-1">
                              Total: {total} {total === 1 ? 'tratamiento' : 'tratamientos'}
                            </div>
                            <div className="space-y-0.5">
                              {segments.map(segment => (
                                <div key={segment.status} className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full ${segment.config.bg}`} />
                                  <span className="text-[9px] sm:text-[10px]">
                                    {segment.config.label}: {segment.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-[9px] sm:text-[10px] text-gray-300">
                            Sin tratamientos
                          </div>
                        )}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                      </div>
                    </div>

                    {/* Día */}
                    <span className={`text-[10px] sm:text-xs font-medium ${isTodayDate ? 'text-emerald-600 font-bold' : isSunday ? 'text-red-500 font-bold' : isSaturday ? 'text-purple-500' : 'text-gray-500'}`}>
                      {dayNamesShort[index]}
                    </span>
                    <span className={`text-[8px] sm:text-[10px] ${isTodayDate ? 'text-emerald-400' : isSunday ? 'text-red-400' : 'text-gray-400'}`}>
                      {format(day, 'd')}
                    </span>

                    <div className="flex flex-col items-center mt-0.5">
                      {isTodayDate && (
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-gray-900">{totalTreatments}</p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">Total tratamientos</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-green-600">{maxTreatmentDay}</p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">Pico máximo</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-emerald-600">
                  {treatmentData[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || 0}
                </p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">Hoy</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-yellow-600">{avgTreatments}</p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">Promedio/día</p>
              </div>
            </div>

            {/* Leyenda siempre visible */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Leyenda:</span>
              {Object.entries(TREATMENT_STATUS_CONFIG).map(([status, config]) => {
                const count = weeklyTreatments.statusBreakdown?.find(
                  item => item.status === status
                )?.count || 0;

                return (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded ${config.bg}`} />
                    <span className="text-xs text-gray-600">
                      {config.label}
                      {count > 0 && ` (${count})`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GRÁFICO 2: CITAS ATENDIDAS (STACKED BAR CHART - 3 ESTADOS) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Citas Atendidas en la Semana</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pacientes atendidos por día</p>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs md:text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {STATUS_FILTERS.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stacked Bar Chart */}
            <div className="flex items-end justify-between h-40 sm:h-52 md:h-64 gap-1 sm:gap-2">
              {weekDays.map((day, index) => {
                const dayData = getAppointmentDayData(day);
                const total = dayData.total;
                const barHeight = maxAppointments > 0 ? (total / maxAppointments) * 200 : 0;
                const isTodayDate = isToday(day);
                const dayOfWeek = getDay(day);
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;
                const dayNamesShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

                const getBarHeight = () => {
                  if (window.innerWidth < 640) return Math.max(barHeight * 0.5, 10);
                  if (window.innerWidth < 1024) return Math.max(barHeight * 0.7, 12);
                  return Math.max(barHeight, 16);
                };

                const segments = APPOINTMENT_STATUS_ORDER
                  .map(status => ({
                    status,
                    count: dayData.statuses?.[status] || 0,
                    config: APPOINTMENT_STATUS_CONFIG[status]
                  }))
                  .filter(seg => seg.count > 0);

                const barHeightPx = getBarHeight();
                const hasData = total > 0;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                    <span className={`text-[10px] sm:text-xs font-semibold ${hasData ? 'text-gray-600' : 'text-gray-300'} mb-0.5 sm:mb-1`}>
                      {total}
                    </span>

                    {/* Barra apilada con placeholder */}
                    <div
                      className="w-full rounded-lg transition-all duration-700 hover:scale-105 cursor-pointer relative group overflow-hidden"
                      style={{ height: `${barHeightPx}px`, minHeight: '8px' }}
                    >
                      {hasData ? (
                        <div className="flex flex-col h-full w-full">
                          {segments.map((segment, segIndex) => {
                            const segmentHeight = total > 0 ? (segment.count / total) * 100 : 0;
                            return (
                              <div
                                key={segment.status}
                                className={`w-full ${segment.config.bg} transition-all duration-500`}
                                style={{
                                  height: `${segmentHeight}%`,
                                  borderTopLeftRadius: segIndex === 0 ? '0.5rem' : '0',
                                  borderTopRightRadius: segIndex === 0 ? '0.5rem' : '0',
                                  borderBottomLeftRadius: segIndex === segments.length - 1 ? '0.5rem' : '0',
                                  borderBottomRightRadius: segIndex === segments.length - 1 ? '0.5rem' : '0',
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

                      {/* Tooltip enriquecido */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-gray-800 text-white text-[10px] sm:text-xs px-2.5 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg">
                        <div className="font-semibold mb-1">
                          {dayNamesShort[index]} {format(day, 'd')}
                        </div>
                        {hasData ? (
                          <>
                            <div className="text-[9px] sm:text-[10px] text-gray-300 mb-1">
                              Total: {total} {total === 1 ? 'cita' : 'citas'}
                            </div>
                            <div className="space-y-0.5">
                              {segments.map(segment => (
                                <div key={segment.status} className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full ${segment.config.bg}`} />
                                  <span className="text-[9px] sm:text-[10px]">
                                    {segment.config.label}: {segment.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-[9px] sm:text-[10px] text-gray-300">
                            Sin citas
                          </div>
                        )}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                      </div>
                    </div>

                    <span className={`text-[10px] sm:text-xs font-medium ${isTodayDate ? 'text-blue-600 font-bold' : isSunday ? 'text-red-500 font-bold' : isSaturday ? 'text-purple-500' : 'text-gray-500'}`}>
                      {dayNamesShort[index]}
                    </span>
                    <span className={`text-[8px] sm:text-[10px] ${isTodayDate ? 'text-blue-400' : isSunday ? 'text-red-400' : 'text-gray-400'}`}>
                      {format(day, 'd')}
                    </span>

                    <div className="flex flex-col items-center mt-0.5">
                      {isTodayDate && (
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-gray-900">{totalAppointments}</p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">Total citas</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-green-600">{maxAppointmentDay}</p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">Pico máximo</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-blue-600">
                  {appointmentData[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || 0}
                </p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">Hoy</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-yellow-600">{avgAppointments}</p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">Promedio/día</p>
              </div>
            </div>

            {/* Leyenda siempre visible */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Leyenda:</span>
              {Object.entries(APPOINTMENT_STATUS_CONFIG).map(([status, config]) => {
                const count = weeklyActivity.statusBreakdown?.find(
                  item => item.status === status
                )?.count || 0;

                return (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded ${config.bg}`} />
                    <span className="text-xs text-gray-600">
                      {config.label}
                      {count > 0 && ` (${count})`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: CALENDARIO + CITAS */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          {/* MINI CALENDARIO */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </h3>
              <div className="flex items-center gap-0.5 md:gap-1">
                <button onClick={goToToday} className="text-[10px] md:text-xs text-primary-600 hover:text-primary-700 px-1.5 md:px-2 py-0.5 md:py-1 hover:bg-primary-50 rounded-lg">
                  Hoy
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                <div key={i} className="text-center text-[10px] md:text-xs font-medium text-gray-400 py-0.5 md:py-1">{day}</div>
              ))}
              {weekDays.map((day, i) => {
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const hasAppointment = monthlyData.daysWithAppointments.includes(day.getDate());

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`text-center rounded-full text-[10px] sm:text-xs md:text-sm transition-all w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center mx-auto relative
                      ${isSelected ? 'bg-blue-100 font-semibold shadow-md' : ''}
                      ${!isSelected && isTodayDate ? 'bg-green-100 text-green-700 font-semibold border-2 border-green-300' : ''}
                      ${!isSelected && !isTodayDate && hasAppointment ? 'bg-blue-50 text-blue-600 font-medium hover:bg-blue-100' : ''}
                      ${!isSelected && !isTodayDate && !hasAppointment ? 'hover:bg-gray-100 text-gray-600' : ''}
                    `}
                  >
                    {format(day, 'd')}
                    {hasAppointment && !isSelected && (
                      <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-primary-400 rounded-full absolute -bottom-0.5 sm:-bottom-1 left-1/2 -translate-x-1/2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CITAS DE LA SEMANA */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-primary-600" />
                <h3 className="text-sm md:text-base font-semibold text-gray-900">Citas de la Semana</h3>
                <span className="text-[10px] md:text-xs bg-primary-50 text-primary-600 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full">
                  {appointments.length} citas
                </span>
              </div>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No hay citas programadas para esta semana
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {appointments.map((appointment) => {
                  const dateParts = appointment.date.split('-').map(Number);
                  const appointmentDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                  const dayNameShort = format(appointmentDate, 'EEE', { locale: es });
                  const dayNumber = format(appointmentDate, 'd');
                  const today = new Date();
                  const todayStr = format(today, 'yyyy-MM-dd');
                  const isTodayDate = appointment.date === todayStr;
                  const photoUrl = getImageUrl(appointment.patientPhoto);

                  return (
                    <div
                      key={appointment.id}
                      className={`flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-xl transition-colors cursor-pointer
                        ${isTodayDate ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <div className="flex-shrink-0 text-center min-w-[40px] md:min-w-[50px]">
                        <p className={`text-[10px] md:text-xs font-bold ${isTodayDate ? 'text-blue-600' : 'text-gray-500'}`}>
                          {isTodayDate ? 'HOY' : dayNameShort.toUpperCase()}
                        </p>
                        <p className={`text-[10px] md:text-xs ${isTodayDate ? 'text-blue-600' : 'text-gray-400'}`}>
                          {dayNumber}
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={appointment.patientName}
                            className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full object-cover border-2 border-white shadow-sm"
                            onError={handleImageError}
                          />
                        ) : null}
                        <div className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border-2 border-white shadow-sm
                          ${photoUrl ? 'fallback-avatar hidden' : ''}`}
                        >
                          <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-primary-700">
                            {getInitials(appointment.patientName)}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {appointment.patientName}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                          {appointment.treatment}
                        </p>
                        {appointment.doctorName && (
                          <p className="text-[8px] sm:text-[10px] text-gray-400">
                            Dr. {appointment.doctorName}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">{appointment.time}</p>
                        <p className="text-[8px] sm:text-xs text-gray-400">{appointment.duration} min</p>
                      </div>

                      <div className="flex-shrink-0 hidden sm:block">
                        <span className={`text-[8px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full
                          ${appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                            appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                              appointment.status === 'COMPLETED' ? 'bg-purple-100 text-purple-700' :
                                'bg-red-100 text-red-700'}`}>
                          {appointment.status === 'CONFIRMED' ? 'Confirmada' :
                            appointment.status === 'SCHEDULED' ? 'Agendada' :
                              appointment.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};