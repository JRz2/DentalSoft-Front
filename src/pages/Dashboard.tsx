import { useState, useEffect, useMemo, useRef } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { format, startOfWeek, addDays } from 'date-fns';
import {
  Loader2, Users, CalendarClock,
  ClipboardList, DollarSign, LayoutDashboard, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { NextAppointmentCard } from '@/components/dashboard/NextAppointmentCard';
import { AttentionPanel } from '@/components/dashboard/AttentionPanel';
import { AppointmentDetailDialog } from '@/components/appointments/AppointmentDetailDialog';
import { appointmentService } from '@/services/appointment.service';
import { Appointment } from '@/types/appointment';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { StackedBarChart } from '@/components/dashboard/StackedBarChart';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WeeklyAppointmentsCard } from '@/components/dashboard/WeeklyAppointmentsCard';
import { usePageHeader } from '@/contexts/PageHeaderContext';

const getInitials = (name?: string) => {
  if (!name || !name.trim()) return '?';
  return name
    .trim()
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'SCHEDULED', label: 'Agendadas' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'COMPLETED', label: 'Completadas' },
];

const TREATMENT_STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'PLANNED', label: 'Planificados' },
  { value: 'IN_PROGRESS', label: 'En Progreso' },
  { value: 'COMPLETED', label: 'Completados' },
  { value: 'CANCELLED', label: 'Cancelados' },
];

const TREATMENT_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PLANNED: { color: 'bg-amber-500', bg: 'bg-amber-500', label: 'Planificados' },
  IN_PROGRESS: { color: 'bg-blue-500', bg: 'bg-blue-500', label: 'En Progreso' },
  COMPLETED: { color: 'bg-emerald-500', bg: 'bg-emerald-500', label: 'Completados' },
  CANCELLED: { color: 'bg-red-500', bg: 'bg-red-500', label: 'Cancelados' },
};

const APPOINTMENT_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  SCHEDULED: { color: 'bg-blue-500', bg: 'bg-blue-500', label: 'Agendadas' },
  CONFIRMED: { color: 'bg-green-500', bg: 'bg-green-500', label: 'Confirmadas' },
  COMPLETED: { color: 'bg-purple-500', bg: 'bg-purple-500', label: 'Completadas' },
};

const TREATMENT_STATUS_ORDER = ['COMPLETED', 'IN_PROGRESS', 'PLANNED', 'CANCELLED'];
const APPOINTMENT_STATUS_ORDER = ['COMPLETED', 'CONFIRMED', 'SCHEDULED'];

export const Dashboard = () => {
  const { data, loading, error, refetch } = useDashboard();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTreatmentStatus, setSelectedTreatmentStatus] = useState<string>('all');

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumen' | 'analisis'>('resumen');
  const isMobile = useMediaQuery('(max-width: 639px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');

  // Ref al contenedor con scroll de los tabs
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  const weekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    []
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    let intervalId: ReturnType<typeof setInterval>;

    const timeoutId = setTimeout(() => {
      setCurrentTime(new Date());
      intervalId = setInterval(() => setCurrentTime(new Date()), 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  usePageHeader(
        'Home',
        'Estadísticas y resumen de tus citas.'
    );

  const handleAppointmentClick = async (appointmentId: number) => {
    try {
      const full = await appointmentService.getById(appointmentId);
      setSelectedAppointment(full);
      setShowAppointmentDetail(true);
    } catch (err) {
      console.error('Error al cargar detalle de cita:', err);
      toast.error('Error al cargar el detalle de la cita');
    }
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
    nextAppointments = [],
    alerts = [],
  } = data || {};

  const appointments = Array.isArray(weekAppointments) ? weekAppointments : [];
  const activityDays = Array.isArray(weeklyActivity.days) ? weeklyActivity.days : [];
  const treatmentDays = Array.isArray(weeklyTreatments.days) ? weeklyTreatments.days : [];

  const getAppointmentDayData = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayData = activityDays.find((d) => d.date === dateStr);
    if (!dayData) return { total: 0, statuses: {} as Record<string, number> };
    if (selectedStatus !== 'all') {
      const count = dayData.statuses?.[selectedStatus] || 0;
      return { total: count, statuses: count > 0 ? { [selectedStatus]: count } : {} };
    }
    return { total: dayData.total || 0, statuses: dayData.statuses || {} };
  };

  const getTreatmentDayData = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayData = treatmentDays.find((d) => d.date === dateStr);
    if (!dayData) return { total: 0, statuses: {} as Record<string, number> };
    if (selectedTreatmentStatus !== 'all') {
      const count = dayData.statuses?.[selectedTreatmentStatus] || 0;
      return { total: count, statuses: count > 0 ? { [selectedTreatmentStatus]: count } : {} };
    }
    return { total: dayData.total || 0, statuses: dayData.statuses || {} };
  };

  const maxAppointments = Math.max(...weekDays.map((d) => getAppointmentDayData(d).total), 0);
  const maxTreatments = Math.max(...weekDays.map((d) => getTreatmentDayData(d).total), 0);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none';
    const parent = e.currentTarget.parentElement;
    const fallback = parent?.querySelector('.fallback-avatar');
    if (fallback) fallback.classList.remove('hidden');
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Link
          to="/patients"
          aria-label="Ver todos los pacientes"
          className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
        >
          <div>
            <p className="text-xs md:text-sm font-medium text-gray-500">Total Pacientes</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">
              {statistics.totalPatients}
            </p>
          </div>
          <div className="absolute bottom-0 right-0 p-2 md:p-3 transition-transform duration-200 group-hover:scale-110">
            <Users className="w-8 h-8 md:w-12 md:h-12 text-gray-500 opacity-20" />
          </div>
        </Link>

        <Link
          to="/appointments"
          aria-label="Ver todas las citas"
          className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
        >
          <div>
            <p className="text-xs md:text-sm font-medium text-gray-500">Citas Pendientes</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">
              {statistics.pendingAppointments}
            </p>
          </div>
          <div className="absolute bottom-0 right-0 p-2 md:p-3 transition-transform duration-200 group-hover:scale-110">
            <CalendarClock className="w-8 h-8 md:w-12 md:h-12 text-blue-500 opacity-20" />
          </div>
        </Link>

        <Link
          to="/treatments"
          aria-label="Ver todos los tratamientos"
          className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
        >
          <div>
            <p className="text-xs md:text-sm font-medium text-gray-500">Tratamientos Activos</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">
              {statistics.activeTreatments}
            </p>
          </div>
          <div className="absolute bottom-0 right-0 p-2 md:p-3 transition-transform duration-200 group-hover:scale-110">
            <ClipboardList className="w-8 h-8 md:w-12 md:h-12 text-emerald-500 opacity-20" />
          </div>
        </Link>

        <Link
          to="/payments"
          aria-label="Ver pagos e ingresos"
          className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
        >
          <div>
            <p className="text-xs md:text-sm font-medium text-gray-500">Ingresos del Mes</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">
              Bs {statistics.monthlyIncome.toLocaleString('es-BO', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
          <div className="absolute bottom-0 right-0 p-2 md:p-3 transition-transform duration-200 group-hover:scale-110">
            <DollarSign className="w-8 h-8 md:w-12 md:h-12 text-green-500 opacity-20" />
          </div>
        </Link>
      </div>

      {/* ROW: Próxima cita + Requiere tu atención */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <NextAppointmentCard
          nextAppointments={nextAppointments}
          currentTime={currentTime}
          onClick={handleAppointmentClick}
        />
        <AttentionPanel alerts={alerts} />
      </div>

      {/* TABS */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          const next = v as 'resumen' | 'analisis';
          setActiveTab(next);
          if (next === 'resumen' && tabsScrollRef.current) {
            tabsScrollRef.current.scrollTop = 0;
          }
        }}
        className="w-full flex flex-col"
      >
        <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-2 h-auto p-1 gap-1 bg-gray-100/80 rounded-xl">
          <TabsTrigger
            value="resumen"
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2',
              'py-2 sm:py-2.5 px-1 sm:px-3 rounded-lg',
              'text-[10px] sm:text-sm font-medium',
              'transition-all duration-200',
              'data-[state=active]:bg-white data-[state=active]:text-primary-700',
              'data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary-100'
            )}
          >
            <LayoutDashboard className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
            <span className="leading-tight text-center">Resumen</span>
            {alerts.length > 0 && (
              <Badge
                variant="secondary"
                className="text-[9px] sm:text-xs h-4 sm:h-5 px-1 min-w-[16px] sm:min-w-[20px] justify-center shrink-0 mt-0.5 sm:mt-0 bg-amber-100 text-amber-700 hover:bg-amber-100"
              >
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="analisis"
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2',
              'py-2 sm:py-2.5 px-1 sm:px-3 rounded-lg',
              'text-[10px] sm:text-sm font-medium',
              'transition-all duration-200',
              'data-[state=active]:bg-white data-[state=active]:text-primary-700',
              'data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary-100'
            )}
          >
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span className="leading-tight text-center">Análisis</span>
          </TabsTrigger>
        </TabsList>

        {/* Contenedor con altura fija + scroll interno */}
        <div
          ref={tabsScrollRef}
          className="mt-4 md:mt-6 h-[450px] sm:h-[550px] lg:h-[650px] overflow-y-auto rounded-2xl"
        >
          {/* TAB: RESUMEN — Lista de citas full-width */}
          <TabsContent
            value="resumen"
            forceMount
            className="w-full data-[state=inactive]:hidden"
          >
            <WeeklyAppointmentsCard
              appointments={appointments}
              onAppointmentClick={handleAppointmentClick}
              onImageError={handleImageError}
              getInitials={getInitials}
            />
          </TabsContent>

          {/* TAB: ANÁLISIS */}
          <TabsContent
            value="analisis"
            forceMount
            className="space-y-4 md:space-y-6 w-full data-[state=inactive]:hidden"
          >
            <StackedBarChart
              weekDays={weekDays}
              getDayData={getTreatmentDayData}
              maxValue={maxTreatments}
              statusOrder={TREATMENT_STATUS_ORDER}
              statusConfig={TREATMENT_STATUS_CONFIG}
              statusBreakdown={weeklyTreatments.statusBreakdown}
              emptyTooltipLabel="Sin tratamientos"
              tooltipSingular="tratamiento"
              tooltipPlural="tratamientos"
              accentColor="emerald"
              filterValue={selectedTreatmentStatus}
              onFilterChange={setSelectedTreatmentStatus}
              filterOptions={TREATMENT_STATUS_FILTERS}
              title="Nuevos Tratamientos en la Semana"
              subtitle="Tratamientos creados por día"
              totalLabel="Total tratamientos"
              isMobile={isMobile}
              isTablet={isTablet}
            />

            <StackedBarChart
              weekDays={weekDays}
              getDayData={getAppointmentDayData}
              maxValue={maxAppointments}
              statusOrder={APPOINTMENT_STATUS_ORDER}
              statusConfig={APPOINTMENT_STATUS_CONFIG}
              statusBreakdown={weeklyActivity.statusBreakdown}
              emptyTooltipLabel="Sin citas"
              tooltipSingular="cita"
              tooltipPlural="citas"
              accentColor="blue"
              filterValue={selectedStatus}
              onFilterChange={setSelectedStatus}
              filterOptions={STATUS_FILTERS}
              title="Citas Atendidas en la Semana"
              subtitle="Pacientes atendidos por día"
              totalLabel="Total citas"
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* MODAL */}
      <AppointmentDetailDialog
        open={showAppointmentDetail}
        onOpenChange={(open) => {
          setShowAppointmentDetail(open);
          if (!open) setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        showClinicalHistoryButton={true}
      />
    </div>
  );
};