import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar,
  Clock,
  Users,
  Stethoscope,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Navegar semana
  const prevWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
  };
  const nextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  return (
    <div className="space-y-6">
      {/* HEADER - Bienvenida */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, <span className="text-primary-600">{user?.name || 'Doctor'}</span> 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <Clock className="h-4 w-4 text-primary-500" />
            <span className="font-mono font-medium text-gray-700">
              {currentTime.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
            <span className="w-px h-4 bg-gray-200" />
            <span>{currentTime.toLocaleDateString('es-ES', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}</span>
            <span className="w-px h-4 bg-gray-200" />
            <span className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              En linea
            </span>
          </div>
        </div>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pacientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">24</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs text-green-600 font-medium">+12%</span>
            <span className="text-xs text-gray-400">vs ayer</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Citas Pendientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">12</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-xs text-yellow-600 font-medium">4 para hoy</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tratamientos Activos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">8</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Stethoscope className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-xs text-green-600 font-medium">En progreso</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ingresos del Mes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">$5,240</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs text-green-600 font-medium">+8%</span>
            <span className="text-xs text-gray-400">vs mes pasado</span>
          </div>
        </div>
      </div>

      {/* MINI CALENDARIO + PRÓXIMAS CITAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MINI CALENDARIO */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={prevWeek}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </button>
              <button
                onClick={goToToday}
                className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={nextWeek}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">
                {day}
              </div>
            ))}
            {weekDays.map((day, i) => {
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const hasAppointment = mockAppointments.some(a => {
                const today = new Date();
                return isSameDay(day, today);
              });

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`
                                        text-center py-1.5 rounded-lg text-sm transition-all
                                        ${isSelected ? 'bg-primary-500 text-white font-semibold' : ''}
                                        ${!isSelected && isTodayDate ? 'bg-primary-50 text-primary-600 font-semibold' : ''}
                                        ${!isSelected && !isTodayDate ? 'hover:bg-gray-50 text-gray-700' : ''}
                                        ${hasAppointment && !isSelected ? 'relative' : ''}
                                    `}
                >
                  {format(day, 'd')}
                  {hasAppointment && !isSelected && (
                    <div className="w-1 h-1 bg-primary-400 rounded-full mx-auto mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mr-1.5" />
              {mockAppointments.length} citas programadas
            </p>
          </div>

          {/* PRÓXIMAS CITAS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Próximas Citas</h3>
                <span className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full">
                  {mockAppointments.length} hoy
                </span>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Ver todas
              </button>
            </div>

            <div className="space-y-3">
              {mockAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  {/* Avatar / Foto */}
                  <div className="flex-shrink-0">
                    {appointment.patientPhoto ? (
                      <img
                        src={appointment.patientPhoto}
                        alt={appointment.patientName}
                        className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-sm font-semibold text-primary-700">
                          {getInitials(appointment.patientName)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info del paciente */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {appointment.patientName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {appointment.treatment}
                    </p>
                  </div>

                  {/* Hora */}
                  <div className="flex-shrink-0 text-right">
                    <p className="font-semibold text-gray-900">{appointment.time}</p>
                    <p className="text-xs text-gray-400">{appointment.duration} min</p>
                  </div>

                  {/* Badge de estado */}
                  <div className="flex-shrink-0">
                    <span className={`
                                        text-xs px-2.5 py-1 rounded-full
                                        ${appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : ''}
                                        ${appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : ''}
                                    `}>
                      {appointment.status === 'CONFIRMED' ? 'Confirmada' : 'Agendada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MINI CALENDARIO  */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={prevWeek}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </button>
              <button
                onClick={goToToday}
                className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={nextWeek}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">
                {day}
              </div>
            ))}
            {weekDays.map((day, i) => {
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const hasAppointment = mockAppointments.some(a => {
                const today = new Date();
                return isSameDay(day, today);
              });

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`
                              text-center rounded-full text-sm transition-all w-8 h-8 flex items-center justify-center mx-auto
                              ${isSelected ? 'bg-blue-100 font-semibold shadow-md shadow-primary-200' : ''}
                              ${!isSelected && isTodayDate ? 'bg-green-100 text-green-700 font-semibold border-2 border-green-300' : ''}
                              ${!isSelected && !isTodayDate && hasAppointment ? 'bg-blue-50 text-blue-600 font-medium hover:bg-blue-100' : ''}
                              ${!isSelected && !isTodayDate && !hasAppointment ? 'hover:bg-gray-100 text-gray-600' : ''}
                              ${hasAppointment && !isSelected && !isTodayDate ? 'ring-1 ring-blue-200' : ''}
                          `}
                >
                  {format(day, 'd')}
                  {hasAppointment && !isSelected && (
                    <div className="w-1 h-1 bg-primary-400 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2" />
                  )}
                </button>                     
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mr-1.5" />
              {mockAppointments.length} citas programadas
            </p>
          </div>

          {/* PRÓXIMAS CITAS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Próximas Citas</h3>
                <span className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full">
                  {mockAppointments.length} hoy
                </span>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Ver todas
              </button>
            </div>

            <div className="space-y-3">
              {mockAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  {/* Avatar / Foto */}
                  <div className="flex-shrink-0">
                    {appointment.patientPhoto ? (
                      <img
                        src={appointment.patientPhoto}
                        alt={appointment.patientName}
                        className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-sm font-semibold text-primary-700">
                          {getInitials(appointment.patientName)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info del paciente */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {appointment.patientName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {appointment.treatment}
                    </p>
                  </div>

                  {/* Hora */}
                  <div className="flex-shrink-0 text-right">
                    <p className="font-semibold text-gray-900">{appointment.time}</p>
                    <p className="text-xs text-gray-400">{appointment.duration} min</p>
                  </div>

                  {/* Badge de estado */}
                  <div className="flex-shrink-0">
                    <span className={`
                                        text-xs px-2.5 py-1 rounded-full
                                        ${appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : ''}
                                        ${appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : ''}
                                    `}>
                      {appointment.status === 'CONFIRMED' ? 'Confirmada' : 'Agendada'}
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