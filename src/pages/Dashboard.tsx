export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500">Pacientes Hoy</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
          <p className="text-xs text-green-600 mt-2">+12% vs ayer</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500">Citas Pendientes</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
          <p className="text-xs text-yellow-600 mt-2">4 para hoy</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500">Tratamientos Activos</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
          <p className="text-xs text-blue-600 mt-2">En progreso</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500">Ingresos del Mes</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">$5,240</p>
          <p className="text-xs text-green-600 mt-2">+8% vs mes pasado</p>
        </div>
      </div>

      {/* Próximas citas */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximas Citas</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">María González</p>
              <p className="text-sm text-gray-500">Consulta general</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">10:00 AM</p>
              <p className="text-xs text-gray-500">Hoy</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Carlos Rodríguez</p>
              <p className="text-sm text-gray-500">Limpieza dental</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">11:30 AM</p>
              <p className="text-xs text-gray-500">Hoy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};