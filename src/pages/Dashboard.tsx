import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Clock, ChevronLeft, ChevronRight, CalendarDays
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday, getDay, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import paciente from '@/assets/images/paciente.png';
import calendario from '@/assets/images/calendario.png';
import consultorio from '@/assets/images/consultorio.png';
import pagos from '@/assets/images/pagos.png';
import doctor from '@/assets/images/doctor.png';

// Datos mock (después conectar con API)
const mockAppointments = [
  {
    id: 1,
    patientName: 'María González',
    patientPhoto: '',
    treatment: 'Consulta general',
    time: '10:00',
    status: 'CONFIRMED',
    duration: 30
  },
  {
    id: 2,
    patientName: 'Carlos Rodríguez',
    patientPhoto: '',
    treatment: 'Limpieza dental',
    time: '11:30',
    status: 'SCHEDULED',
    duration: 45
  },
  {
    id: 3,
    patientName: 'Ana Martínez',
    patientPhoto: '',
    treatment: 'Endodoncia',
    time: '14:00',
    status: 'SCHEDULED',
    duration: 60
  },
  {
    id: 4,
    patientName: 'Pedro Gómez',
    patientPhoto: '',
    treatment: 'Ortodoncia',
    time: '16:30',
    status: 'SCHEDULED',
    duration: 30
  }
];

// Días festivos (ejemplo - puedes expandir)
const getHolidays = (year: number, month: number) => {
  const monthHolidays: Record<number, Record<number, string>> = {
    1: { 1: 'Año Nuevo' },
    12: { 24: 'Nochebuena', 25: 'Navidad', 31: 'Fin de Año' }
  };
  return monthHolidays[month] || {};
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const Dashboard = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Generar días de la semana actual
  const weekStart = startOfWeek(currentDate, { locale: es });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Generar días de la semana anterior
  const previousWeekStart = startOfWeek(subWeeks(currentDate, 1), { locale: es });
  const previousWeekDays = Array.from({ length: 7 }, (_, i) => addDays(previousWeekStart, i));

  // Datos mock de pacientes por día
  const mockPatients = [4, 7, 3, 8, 6, 5, 2];
  
  // Datos mock de la semana anterior (con algunos días sin actividad)
  const mockPreviousWeekPatients = [3, 5, 0, 6, 4, 0, 1];
  const maxPatients = Math.max(...mockPatients);
  const maxPreviousPatients = Math.max(...mockPreviousWeekPatients);
  const containerHeight = 256;
  const maxBarHeight = containerHeight - 50;

  // Verificar si hay datos en la semana anterior
  const hasPreviousWeekData = mockPreviousWeekPatients.some(p => p > 0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Navegar semana (solo para el calendario)
  const prevWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
    setSelectedDate(prev => addDays(prev, -7));
  };
  const nextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
    setSelectedDate(prev => addDays(prev, 7));
  };
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
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
            <span className="w-px h-4 bg-gray-200 hidden sm:block" />
            <span className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-green-500"></span>
              </span>
              <span className="hidden xs:inline">En linea</span>
            </span>
          </div>
        </div>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Tarjeta: Total Pacientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500">Total Pacientes</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">24</p>
            </div>
          </div>
          {/* Imagen responsiva */}
          <img
            src={paciente}
            alt="paciente"
            className="absolute bottom-0 right-0 w-12 h-12 md:w-16 md:h-16 object-contain opacity-80"
          />
        </div>

        {/* Tarjeta: Citas Pendientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500">Citas Pendientes</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">12</p>
            </div>
          </div>
          <img
            src={calendario}
            alt="calendario"
            className="absolute bottom-0 right-0 w-12 h-12 md:w-16 md:h-16 object-contain opacity-80"
          />
        </div>

        {/* Tarjeta: Tratamientos Activos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500">Tratamientos Activos</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">8</p>
            </div>
          </div>
          <img
            src={consultorio}
            alt="consultorio"
            className="absolute bottom-0 right-0 w-12 h-12 md:w-16 md:h-16 object-contain opacity-80"
          />
        </div>

        {/* Tarjeta: Ingresos del Mes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500">Ingresos del Mes</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">$5,240</p>
            </div>
          </div>
          <img
            src={pagos}
            alt="pagos"
            className="absolute bottom-0 right-0 w-12 h-12 md:w-16 md:h-16 object-contain opacity-80"
          />
        </div>
      </div>

      {/* GRID: GRÁFICO + CALENDARIO + CITAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* COLUMNA IZQUIERDA: GRÁFICOS SEMANALES (2 columnas) */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* GRÁFICO DE ACTIVIDAD SEMANAL */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            {/* Cabecera */}
            <div className="mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Actividad Semanal</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Pacientes atendidos por día
              </p>
            </div>

            {/* Gráfico de barras - altura responsiva */}
            <div className="flex items-end justify-between h-40 sm:h-52 md:h-64 gap-1 sm:gap-2">
              {weekDays.map((day, index) => {
                const patientCount = mockPatients[index];
                const barHeight = maxPatients > 0 
                  ? (patientCount / maxPatients) * maxBarHeight 
                  : 0;

                const isTodayDate = isToday(day);
                const dayOfWeek = getDay(day);
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;
                const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                
                const year = day.getFullYear();
                const month = day.getMonth() + 1;
                const dayNumber = day.getDate();
                const holidays = getHolidays(year, month);
                const isHoliday = holidays[dayNumber] !== undefined;
                const holidayName = holidays[dayNumber];

                let barColor = 'from-blue-400 to-blue-300';
                if (isSunday) {
                  barColor = 'from-red-400 to-red-300';
                } else if (isSaturday) {
                  barColor = 'from-purple-400 to-purple-300';
                } else if (isTodayDate) {
                  barColor = 'from-blue-600 to-blue-400';
                } else if (isHoliday) {
                  barColor = 'from-yellow-500 to-yellow-400';
                }

                // Altura responsiva
                const getBarHeight = () => {
                  if (window.innerWidth < 640) return Math.max(barHeight * 0.6, 10);
                  if (window.innerWidth < 1024) return Math.max(barHeight * 0.8, 12);
                  return Math.max(barHeight, 16);
                };

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                    <div className="relative w-full flex flex-col items-center">
                      <span className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-0.5 sm:mb-1">
                        {patientCount}
                      </span>
                      <div
                        className={`w-full rounded-lg transition-all duration-700 hover:scale-105 cursor-pointer relative group
                          bg-gradient-to-t ${barColor}
                          ${isTodayDate ? 'shadow-lg shadow-blue-200' : ''}
                          ${isSunday ? 'shadow-lg shadow-red-200' : ''}
                          ${isHoliday ? 'shadow-lg shadow-yellow-200' : ''}
                        `}
                        style={{
                          height: `${getBarHeight()}px`,
                          minHeight: '8px'
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] sm:text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {patientCount} pacientes
                          {isHoliday && ` (${holidayName})`}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] sm:text-xs font-medium ${
                        isTodayDate ? 'text-blue-600 font-bold' : 
                        isSunday ? 'text-red-500 font-bold' : 
                        isSaturday ? 'text-purple-500' : 
                        'text-gray-500'
                      }`}>
                        {dayNames[index]}
                      </span>
                      <span className={`text-[8px] sm:text-[10px] ${
                        isTodayDate ? 'text-blue-400 font-medium' : 
                        isSunday ? 'text-red-400' : 
                        'text-gray-400'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      
                      <div className="flex flex-col items-center mt-0.5">
                        {isTodayDate && (
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                        )}
                        {isHoliday && !isSunday && (
                          <span className="text-[6px] sm:text-[8px] text-yellow-500 font-semibold">🎉</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leyenda - responsiva */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 border-t border-gray-100">
              <span className="text-[10px] sm:text-xs text-gray-500">Leyenda:</span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-gradient-to-t from-blue-500 to-blue-400"></div>
                <span className="text-[10px] sm:text-xs text-gray-600">Hoy</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-gradient-to-t from-red-400 to-red-300"></div>
                <span className="text-[10px] sm:text-xs text-gray-600">Domingo</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-gradient-to-t from-purple-400 to-purple-300"></div>
                <span className="text-[10px] sm:text-xs text-gray-600">Sábado</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-gradient-to-t from-yellow-500 to-yellow-400"></div>
                <span className="text-[10px] sm:text-xs text-gray-600">Festivo</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-gradient-to-t from-blue-400 to-blue-300"></div>
                <span className="text-[10px] sm:text-xs text-gray-600">Normal</span>
              </div>
            </div>

            {/* Estadísticas rápidas - responsivas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-gray-900">
                  {mockPatients.reduce((a, b) => a + b, 0)}
                </p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">Total semana</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-green-600">
                  {Math.max(...mockPatients)}
                </p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">Pico máximo</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-blue-600">
                  {mockPatients[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || 0}
                </p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">Hoy</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-yellow-600">
                  {Math.round(mockPatients.reduce((a, b) => a + b, 0) / 7)}
                </p>
                <p className="text-[8px] sm:text-[10px] text-gray-500">Promedio/día</p>
              </div>
            </div>
          </div>

          {/* GRÁFICO DE SEMANA ANTERIOR */}
          {hasPreviousWeekData ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 opacity-90">
              <div className="mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Actividad Semana Anterior</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pacientes atendidos por día (semana pasada)
                </p>
              </div>

              <div className="flex items-end justify-between h-32 sm:h-40 md:h-52 gap-1 sm:gap-2">
                {previousWeekDays.map((day, index) => {
                  const patientCount = mockPreviousWeekPatients[index] || 0;
                  const barHeight = maxPreviousPatients > 0 
                    ? (patientCount / maxPreviousPatients) * (200 - 50)
                    : 0;

                  const isTodayDate = isToday(day);
                  const dayOfWeek = getDay(day);
                  const isSunday = dayOfWeek === 0;
                  const isSaturday = dayOfWeek === 6;
                  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                  
                  const year = day.getFullYear();
                  const month = day.getMonth() + 1;
                  const dayNumber = day.getDate();
                  const holidays = getHolidays(year, month);
                  const isHoliday = holidays[dayNumber] !== undefined;
                  const holidayName = holidays[dayNumber];

                  let barColor = 'from-gray-400 to-gray-300';
                  if (isSunday) {
                    barColor = 'from-red-400 to-red-300';
                  } else if (isSaturday) {
                    barColor = 'from-purple-400 to-purple-300';
                  } else if (isTodayDate) {
                    barColor = 'from-blue-600 to-blue-400';
                  } else if (isHoliday) {
                    barColor = 'from-yellow-500 to-yellow-400';
                  }

                  const getBarHeight = () => {
                    if (window.innerWidth < 640) return Math.max(barHeight * 0.6, 8);
                    if (window.innerWidth < 1024) return Math.max(barHeight * 0.8, 10);
                    return Math.max(barHeight, 12);
                  };

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div className="relative w-full flex flex-col items-center">
                        <span className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-0.5 sm:mb-1">
                          {patientCount}
                        </span>
                        <div
                          className={`w-full rounded-lg transition-all duration-700 hover:scale-105 cursor-pointer relative group
                            bg-gradient-to-t ${barColor}
                            opacity-70
                            ${isSunday ? 'shadow-lg shadow-red-200' : ''}
                            ${isHoliday ? 'shadow-lg shadow-yellow-200' : ''}
                          `}
                          style={{
                            height: `${getBarHeight()}px`,
                            minHeight: '6px'
                          }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] sm:text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {patientCount} pacientes
                            {isHoliday && ` (${holidayName})`}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] sm:text-xs font-medium ${
                          isSunday ? 'text-red-500 font-bold' : 
                          isSaturday ? 'text-purple-500' : 
                          'text-gray-400'
                        }`}>
                          {dayNames[index]}
                        </span>
                        <span className={`text-[8px] sm:text-[10px] ${
                          isSunday ? 'text-red-400' : 
                          'text-gray-300'
                        }`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-base sm:text-lg font-bold text-gray-900">
                    {mockPreviousWeekPatients.reduce((a, b) => a + b, 0)}
                  </p>
                  <p className="text-[8px] sm:text-[10px] text-gray-500">Total semana</p>
                </div>
                <div className="text-center">
                  <p className="text-base sm:text-lg font-bold text-green-600">
                    {Math.max(...mockPreviousWeekPatients)}
                  </p>
                  <p className="text-[8px] sm:text-[10px] text-gray-500">Pico máximo</p>
                </div>
                <div className="text-center">
                  <p className="text-base sm:text-lg font-bold text-yellow-600">
                    {Math.round(mockPreviousWeekPatients.reduce((a, b) => a + b, 0) / 7)}
                  </p>
                  <p className="text-[8px] sm:text-[10px] text-gray-500">Promedio/día</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
              <div className="mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Actividad Semana Anterior</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pacientes atendidos por día (semana pasada)</p>
              </div>
              <div className="flex items-center justify-center h-24 sm:h-32 md:h-40">
                <p className="text-gray-400 text-xs sm:text-sm">No se encontró actividad semanal anterior</p>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: MINI CALENDARIO + PRÓXIMAS CITAS */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          {/* MINI CALENDARIO */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </h3>
              <div className="flex items-center gap-0.5 md:gap-1">
                <button
                  onClick={prevWeek}
                  className="p-1 md:p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                </button>
                <button
                  onClick={goToToday}
                  className="text-[10px] md:text-xs text-primary-600 hover:text-primary-700 px-1.5 md:px-2 py-0.5 md:py-1 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  Hoy
                </button>
                <button
                  onClick={nextWeek}
                  className="p-1 md:p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                <div key={i} className="text-center text-[10px] md:text-xs font-medium text-gray-400 py-0.5 md:py-1">
                  {day}
                </div>
              ))}
              {weekDays.map((day, i) => {
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const hasAppointment = mockAppointments.some(() => {
                  return isSameDay(day, new Date());
                });
                const dayOfWeek = getDay(day);
                const isSunday = dayOfWeek === 0;
                
                const year = day.getFullYear();
                const month = day.getMonth() + 1;
                const dayNumber = day.getDate();
                const holidays = getHolidays(year, month);
                const isHoliday = holidays[dayNumber] !== undefined;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      text-center rounded-full text-[10px] sm:text-xs md:text-sm transition-all w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center mx-auto relative
                      ${isSelected ? 'bg-blue-100 font-semibold shadow-md shadow-primary-200' : ''}
                      ${!isSelected && isTodayDate ? 'bg-green-100 text-green-700 font-semibold border-2 border-green-300' : ''}
                      ${!isSelected && !isTodayDate && hasAppointment ? 'bg-blue-50 text-blue-600 font-medium hover:bg-blue-100' : ''}
                      ${!isSelected && !isTodayDate && !hasAppointment ? 'hover:bg-gray-100 text-gray-600' : ''}
                      ${isSunday && !isSelected && !isTodayDate ? 'text-red-400' : ''}
                      ${isHoliday && !isSelected && !isTodayDate ? 'text-yellow-600' : ''}
                      ${hasAppointment && !isSelected && !isTodayDate ? 'ring-1 ring-blue-200' : ''}
                    `}
                  >
                    {format(day, 'd')}
                    {hasAppointment && !isSelected && (
                      <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-primary-400 rounded-full absolute -bottom-0.5 sm:-bottom-1 left-1/2 -translate-x-1/2" />
                    )}
                    {isHoliday && !isSelected && !isTodayDate && (
                      <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 text-[6px] sm:text-[8px]">🎉</span>
                    )}
                    {isSunday && !isSelected && !isTodayDate && (
                      <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 text-[6px] sm:text-[8px] text-red-400">✝</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100">
              <p className="text-[10px] sm:text-xs text-gray-500">
                <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-500 rounded-full mr-1 sm:mr-1.5" />
                {mockAppointments.length} citas programadas
              </p>
            </div>
          </div>

          {/* PRÓXIMAS CITAS - RESPONSIVA */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-primary-600" />
                <h3 className="text-sm md:text-base font-semibold text-gray-900">Próximas Citas</h3>
                <span className="text-[10px] md:text-xs bg-primary-50 text-primary-600 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full">
                  {mockAppointments.length} hoy
                </span>
              </div>
              <button className="text-[10px] md:text-sm text-primary-600 hover:text-primary-700 font-medium">
                Ver todas
              </button>
            </div>

            <div className="space-y-2 md:space-y-3">
              {mockAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-2 md:gap-4 p-2 md:p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  {/* Avatar / Foto - Responsivo */}
                  <div className="flex-shrink-0">
                    {appointment.patientPhoto ? (
                      <img
                        src={appointment.patientPhoto}
                        alt={appointment.patientName}
                        className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-primary-700">
                          {getInitials(appointment.patientName)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info del paciente - Responsiva */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {appointment.patientName}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                      {appointment.treatment}
                    </p>
                  </div>

                  {/* Hora - Responsiva */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{appointment.time}</p>
                    <p className="text-[8px] sm:text-xs text-gray-400">{appointment.duration} min</p>
                  </div>

                  {/* Badge de estado - Responsivo */}
                  <div className="flex-shrink-0 hidden sm:block">
                    <span className={`
                      text-[8px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full
                      ${appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : ''}
                      ${appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : ''}
                    `}>
                      {appointment.status === 'CONFIRMED' ? 'Confirmada' : 'Agendada'}
                    </span>
                  </div>
                  
                  {/* Badge simplificado para móvil */}
                  <div className="flex-shrink-0 sm:hidden">
                    <span className={`
                      text-[8px] px-1.5 py-0.5 rounded-full
                      ${appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : ''}
                      ${appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : ''}
                    `}>
                      {appointment.status === 'CONFIRMED' ? '✓' : '📅'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};